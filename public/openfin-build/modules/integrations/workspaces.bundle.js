/******/ var __webpack_modules__ = ({

/***/ "./client/src/framework/uuid.ts":
/*!**************************************!*\
  !*** ./client/src/framework/uuid.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   randomUUID: () => (/* binding */ randomUUID)
/* harmony export */ });
function randomUUID() {
    if ("randomUUID" in window.crypto) {
        // eslint-disable-next-line no-restricted-syntax
        return window.crypto.randomUUID();
    }
    // Polyfill the window.crypto.randomUUID if we are running in a non secure context that doesn't have it
    // we are still using window.crypto.getRandomValues which is always available
    // https://stackoverflow.com/a/2117523/2800218
    const getRandomHex = (c) => 
    // eslint-disable-next-line no-bitwise, no-mixed-operators
    (c ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, getRandomHex);
}


/***/ }),

/***/ "./client/src/modules/integrations/workspaces/integration.ts":
/*!*******************************************************************!*\
  !*** ./client/src/modules/integrations/workspaces/integration.ts ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WorkspacesProvider: () => (/* binding */ WorkspacesProvider)
/* harmony export */ });
/* harmony import */ var _framework_uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../framework/uuid */ "./client/src/framework/uuid.ts");

/**
 * Implement the integration provider for workspaces.
 */
class WorkspacesProvider {
    /**
     * Initialize the module.
     * @param definition The definition of the module from configuration include custom options.
     * @param loggerCreator For logging entries.
     * @param helpers Helper methods for the module to interact with the application core.
     * @returns Nothing.
     */
    async initialize(definition, loggerCreator, helpers) {
        this._settings = definition.data;
        this._integrationHelpers = helpers;
        this._logger = loggerCreator('WorkspacesProvider');
        this._integrationHelpers.subscribeLifecycleEvent('workspace-changed', async (platform, payload) => {
            if (payload.action === 'create') {
                if (!this._lastQuery.startsWith('/w ')) {
                    await this.rebuildResults(platform);
                }
            }
            else if (payload.action === 'update') {
                const lastResult = this._lastResults?.find((res) => res.key === payload.id);
                if (lastResult) {
                    lastResult.title = payload.workspace.title;
                    lastResult.data.workspaceTitle = payload.workspace.title;
                    lastResult.templateContent.data.title = payload.workspace.title;
                    this.resultAddUpdate([lastResult]);
                }
            }
            else if (payload.action === 'delete') {
                this.resultRemove(payload.id);
            }
        });
        this._integrationHelpers.subscribeLifecycleEvent('theme-changed', async () => {
            const platform = this._integrationHelpers.getPlatform();
            await this.rebuildResults(platform);
        });
    }
    /**
     * Get a list of the static help entries.
     * @returns The list of help entries.
     */
    async getHelpSearchEntries() {
        const colorScheme = await this._integrationHelpers.getCurrentColorSchemeMode();
        return [
            {
                key: `${WorkspacesProvider._PROVIDER_ID}-help1`,
                title: 'Workspaces',
                label: 'Help',
                icon: this._settings.images.workspace.replace('{scheme}', colorScheme),
                actions: [],
                data: {
                    providerId: WorkspacesProvider._PROVIDER_ID,
                },
                template: 'Custom',
                templateContent: await this._integrationHelpers.templateHelpers.createHelp('Workspaces', ['Use the workspaces command to save your current layout.'], ['/w title']),
            },
        ];
    }
    /**
     * Get a list of search results based on the query and filters.
     * @param query The query to search for.
     * @param filters The filters to apply.
     * @param lastResponse The last search response used for updating existing results.
     * @param options Options for the search query.
     * @returns The list of results and new filters.
     */
    async getSearchResults(query, filters, lastResponse, options) {
        const platform = this._integrationHelpers.getPlatform();
        const workspaces = await platform.Storage.getWorkspaces();
        const colorScheme = await this._integrationHelpers.getCurrentColorSchemeMode();
        const queryLower = query.toLowerCase();
        this._lastResponse = lastResponse;
        this._lastQuery = queryLower;
        this._lastQueryMinLength = options.queryMinLength;
        if (queryLower.startsWith('/w ')) {
            const title = queryLower.replace('/w ', '');
            const foundMatch = workspaces.find((entry) => entry.title.toLowerCase() === title.toLowerCase());
            if (foundMatch) {
                return {
                    results: [
                        {
                            key: WorkspacesProvider._ACTION_EXISTS_WORKSPACE,
                            title: `Workspace ${foundMatch.title} already exists.`,
                            icon: this._settings.images.workspace.replace('{scheme}', colorScheme),
                            actions: [],
                            data: {
                                providerId: WorkspacesProvider._PROVIDER_ID,
                                tags: ['workspace'],
                                workspaceId: foundMatch.workspaceId,
                            },
                            template: null,
                            templateContent: null,
                        },
                    ],
                };
            }
            return {
                results: [
                    {
                        key: WorkspacesProvider._ACTION_SAVE_WORKSPACE,
                        title: `Save Current Workspace as ${title}`,
                        icon: this._settings.images.workspace.replace('{scheme}', colorScheme),
                        label: 'Suggestion',
                        actions: [{ name: 'Save Workspace', hotkey: 'Enter' }],
                        data: {
                            providerId: WorkspacesProvider._PROVIDER_ID,
                            tags: ['workspace'],
                            workspaceId: (0,_framework_uuid__WEBPACK_IMPORTED_MODULE_0__.randomUUID)(),
                            workspaceTitle: title,
                        },
                        template: null,
                        templateContent: null,
                    },
                ],
            };
        }
        const workspaceResults = await this.buildResults(platform, workspaces, queryLower, options.queryMinLength, colorScheme);
        this._lastResults = workspaceResults;
        return {
            results: workspaceResults,
        };
    }
    /**
     * An entry has been selected.
     * @param result The dispatched result.
     * @param lastResponse The last response.
     * @returns True if the item was handled.
     */
    async itemSelection(result, lastResponse) {
        let handled = false;
        if (result.action.trigger === 'user-action') {
            const data = result.data;
            if (data?.workspaceId) {
                handled = true;
                if (result.key === WorkspacesProvider._ACTION_SAVE_WORKSPACE) {
                    // Remove the save workspace entry
                    this.resultRemove(result.key);
                    const platform = this._integrationHelpers.getPlatform();
                    const snapshot = await platform.getSnapshot();
                    const currentWorkspace = await platform.getCurrentWorkspace();
                    const currentMetaData = currentWorkspace?.metadata;
                    const workspace = {
                        workspaceId: data.workspaceId,
                        title: data.workspaceTitle,
                        metadata: currentMetaData,
                        snapshot,
                    };
                    await platform.Storage.saveWorkspace(workspace);
                    const shareEnabled = await this._integrationHelpers.condition('sharing');
                    const palette = await this._integrationHelpers.getCurrentPalette();
                    const colorScheme = await this._integrationHelpers.getCurrentColorSchemeMode();
                    const savedWorkspace = this.getWorkspaceTemplate(workspace.workspaceId, workspace.title, shareEnabled, true, colorScheme, palette);
                    // And add the new one
                    this.resultAddUpdate([savedWorkspace]);
                }
                else if (result.key === WorkspacesProvider._ACTION_EXISTS_WORKSPACE) {
                    // Do nothing, the user must update the query to give it a different
                    // name which will automatically refresh the results
                }
                else if (result.action.name === WorkspacesProvider._ACTION_OPEN_WORKSPACE) {
                    const platform = this._integrationHelpers.getPlatform();
                    const workspace = await platform.Storage.getWorkspace(data.workspaceId);
                    await platform.applyWorkspace(workspace);
                    // We rebuild the results here as we will now have a new current workspace
                    // and we need to change the existing one back to a standard template
                    await this.rebuildResults(platform);
                }
                else if (result.action.name === WorkspacesProvider._ACTION_DELETE_WORKSPACE) {
                    const platform = this._integrationHelpers.getPlatform();
                    await platform.Storage.deleteWorkspace(data.workspaceId);
                    // Deleting the working will eventually trigger the "delete" lifecycle
                    // event which will remove it from the result list
                }
                else if (result.action.name === WorkspacesProvider._ACTION_SHARE_WORKSPACE) {
                    await this._integrationHelpers.share({ workspaceId: data.workspaceId });
                }
                else {
                    handled = false;
                    this._logger.warn(`Unrecognized action for workspace selection: ${data.workspaceId}`);
                }
            }
        }
        return handled;
    }
    getWorkspaceTemplate(id, title, shareEnabled, isCurrent, colorScheme, palette) {
        let actions = [];
        let layout;
        let data;
        if (isCurrent) {
            layout = this.getOtherWorkspaceTemplate(shareEnabled, false, palette);
            data = {
                title,
                instructions: 'This is the currently active workspace. You can use the Browser menu to update/rename this workspace',
                openText: 'Open',
                shareText: 'Share',
            };
            if (shareEnabled) {
                actions.push({
                    name: WorkspacesProvider._ACTION_SHARE_WORKSPACE,
                    hotkey: 'CmdOrCtrl+Shift+S',
                });
            }
            actions = actions.concat([
                {
                    name: WorkspacesProvider._ACTION_OPEN_WORKSPACE,
                    hotkey: 'Enter',
                },
            ]);
        }
        else {
            if (shareEnabled) {
                actions.push({
                    name: WorkspacesProvider._ACTION_SHARE_WORKSPACE,
                    hotkey: 'CmdOrCtrl+Shift+S',
                });
            }
            actions = actions.concat([
                {
                    name: WorkspacesProvider._ACTION_DELETE_WORKSPACE,
                    hotkey: 'CmdOrCtrl+Shift+D',
                },
                {
                    name: WorkspacesProvider._ACTION_OPEN_WORKSPACE,
                    hotkey: 'Enter',
                },
            ]);
            layout = this.getOtherWorkspaceTemplate(shareEnabled, true, palette);
            data = {
                title,
                instructions: 'Use the buttons below to interact with your saved workspace',
                openText: 'Open',
                deleteText: 'Delete',
                shareText: 'Share',
            };
        }
        return {
            key: id,
            title,
            label: 'Workspace',
            icon: this._settings.images.workspace.replace('{scheme}', colorScheme),
            actions,
            data: {
                providerId: WorkspacesProvider._PROVIDER_ID,
                workspaceTitle: title,
                workspaceId: id,
                tags: ['workspace'],
            },
            template: 'Custom',
            templateContent: {
                layout,
                data,
            },
        };
    }
    getOtherWorkspaceTemplate(enableShare, enableDelete, palette) {
        const actionButtons = [
            {
                type: 'Button',
                action: WorkspacesProvider._ACTION_OPEN_WORKSPACE,
                children: [
                    {
                        type: 'Text',
                        dataKey: 'openText',
                    },
                ],
            },
        ];
        if (enableDelete) {
            actionButtons.push({
                type: 'Button',
                buttonStyle: 'primary',
                action: WorkspacesProvider._ACTION_DELETE_WORKSPACE,
                children: [
                    {
                        type: 'Text',
                        dataKey: 'deleteText',
                    },
                ],
            });
        }
        if (enableShare) {
            actionButtons.push({
                type: 'Button',
                buttonStyle: 'primary',
                action: WorkspacesProvider._ACTION_SHARE_WORKSPACE,
                children: [
                    {
                        type: 'Text',
                        dataKey: 'shareText',
                    },
                ],
            });
        }
        return {
            type: 'Container',
            style: {
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
            },
            children: [
                {
                    type: 'Text',
                    dataKey: 'title',
                    style: {
                        fontWeight: 'bold',
                        fontSize: '16px',
                        paddingBottom: '5px',
                        marginBottom: '10px',
                        borderBottom: `1px solid ${palette.background6}`,
                    },
                },
                {
                    type: 'Text',
                    dataKey: 'instructions',
                    style: {
                        flex: 1,
                    },
                },
                {
                    type: 'Container',
                    style: {
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px',
                    },
                    children: actionButtons,
                },
            ],
        };
    }
    async rebuildResults(platform) {
        const colorScheme = await this._integrationHelpers.getCurrentColorSchemeMode();
        const workspaces = await platform.Storage.getWorkspaces();
        const results = await this.buildResults(platform, workspaces, this._lastQuery, this._lastQueryMinLength, colorScheme);
        this.resultAddUpdate(results);
    }
    async buildResults(platform, workspaces, query, queryMinLength, colorScheme) {
        let results = [];
        if (Array.isArray(workspaces)) {
            const currentWorkspace = await platform.getCurrentWorkspace();
            const currentWorkspaceId = currentWorkspace?.workspaceId;
            const shareEnabled = await this._integrationHelpers.condition('sharing');
            const palette = await this._integrationHelpers.getCurrentPalette();
            results = workspaces
                .filter((pg) => query.length === 0 || (query.length >= queryMinLength && pg.title.toLowerCase().includes(query)))
                .map((ws, index) => this.getWorkspaceTemplate(ws.workspaceId, ws.title, shareEnabled, currentWorkspaceId === ws.workspaceId, colorScheme, palette))
                .sort((a, b) => a.title.localeCompare(b.title));
        }
        return results;
    }
    resultAddUpdate(results) {
        if (this._lastResults) {
            for (const result of results) {
                const resultIndex = this._lastResults.findIndex((res) => res.key === result.key);
                if (resultIndex >= 0) {
                    this._lastResults.splice(resultIndex, 1, result);
                }
                else {
                    this._lastResults.push(result);
                }
            }
        }
        if (this._lastResponse) {
            this._lastResponse.respond(results);
        }
    }
    resultRemove(id) {
        if (this._lastResults) {
            const resultIndex = this._lastResults.findIndex((res) => res.key === id);
            if (resultIndex >= 0) {
                this._lastResults.splice(resultIndex, 1);
            }
        }
        if (this._lastResponse) {
            this._lastResponse.revoke(id);
        }
    }
}
/**
 * Provider id.
 * @internal
 */
WorkspacesProvider._PROVIDER_ID = 'workspaces';
/**
 * The key to use for opening a workspace.
 * @internal
 */
WorkspacesProvider._ACTION_OPEN_WORKSPACE = 'Open Workspace';
/**
 * The key to use for deleting a workspace.
 * @internal
 */
WorkspacesProvider._ACTION_DELETE_WORKSPACE = 'Delete Workspace';
/**
 * The key to use for sharing a workspace.
 * @internal
 */
WorkspacesProvider._ACTION_SHARE_WORKSPACE = 'Share Workspace';
/**
 * The key to use for saving a workspace.
 * @internal
 */
WorkspacesProvider._ACTION_SAVE_WORKSPACE = 'Save Workspace';
/**
 * The key to use for a workspace exists.
 * @internal
 */
WorkspacesProvider._ACTION_EXISTS_WORKSPACE = 'Workspace Exists';


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*************************************************************!*\
  !*** ./client/src/modules/integrations/workspaces/index.ts ***!
  \*************************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   entryPoints: () => (/* binding */ entryPoints)
/* harmony export */ });
/* harmony import */ var _integration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./integration */ "./client/src/modules/integrations/workspaces/integration.ts");

const entryPoints = {
    integrations: new _integration__WEBPACK_IMPORTED_MODULE_0__.WorkspacesProvider()
};

})();

var __webpack_exports__entryPoints = __webpack_exports__.entryPoints;
export { __webpack_exports__entryPoints as entryPoints };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ozs7Ozs7QUNObUQ7QUFFNUMsTUFBTSxXQUFXLEdBQXlDO0lBQ2hFLFlBQVksRUFBRSxJQUFJLDREQUFrQixFQUFFO0NBQ3RDLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9vcGVuZmluLXdvcmtzcGFjZS8uL2NsaWVudC9zcmMvZnJhbWV3b3JrL3V1aWQudHMiLCJ3ZWJwYWNrOi8vb3BlbmZpbi13b3Jrc3BhY2UvLi9jbGllbnQvc3JjL21vZHVsZXMvaW50ZWdyYXRpb25zL3dvcmtzcGFjZXMvaW50ZWdyYXRpb24udHMiLCJ3ZWJwYWNrOi8vb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL29wZW5maW4td29ya3NwYWNlL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9vcGVuZmluLXdvcmtzcGFjZS8uL2NsaWVudC9zcmMvbW9kdWxlcy9pbnRlZ3JhdGlvbnMvd29ya3NwYWNlcy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpOiBzdHJpbmcge1xyXG5cdGlmIChcInJhbmRvbVVVSURcIiBpbiB3aW5kb3cuY3J5cHRvKSB7XHJcblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXhcclxuXHRcdHJldHVybiB3aW5kb3cuY3J5cHRvLnJhbmRvbVVVSUQoKTtcclxuXHR9XHJcblx0Ly8gUG9seWZpbGwgdGhlIHdpbmRvdy5jcnlwdG8ucmFuZG9tVVVJRCBpZiB3ZSBhcmUgcnVubmluZyBpbiBhIG5vbiBzZWN1cmUgY29udGV4dCB0aGF0IGRvZXNuJ3QgaGF2ZSBpdFxyXG5cdC8vIHdlIGFyZSBzdGlsbCB1c2luZyB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyB3aGljaCBpcyBhbHdheXMgYXZhaWxhYmxlXHJcblx0Ly8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIxMTc1MjMvMjgwMDIxOFxyXG5cdGNvbnN0IGdldFJhbmRvbUhleCA9IChjKSA9PlxyXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2UsIG5vLW1peGVkLW9wZXJhdG9yc1xyXG5cdFx0KGMgXiAod2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoMSkpWzBdICYgKDE1ID4+IChjIC8gNCkpKSkudG9TdHJpbmcoMTYpO1xyXG5cdHJldHVybiBcIjEwMDAwMDAwLTEwMDAtNDAwMC04MDAwLTEwMDAwMDAwMDAwMFwiLnJlcGxhY2UoL1swMThdL2csIGdldFJhbmRvbUhleCk7XHJcbn1cclxuIiwiaW1wb3J0IHR5cGUge1xyXG4gIEJ1dHRvblN0eWxlLFxyXG4gIENMSUZpbHRlcixcclxuICBDTElUZW1wbGF0ZSxcclxuICBDdXN0b21UZW1wbGF0ZSxcclxuICBIb21lRGlzcGF0Y2hlZFNlYXJjaFJlc3VsdCxcclxuICBIb21lU2VhcmNoTGlzdGVuZXJSZXNwb25zZSxcclxuICBIb21lU2VhcmNoUmVzcG9uc2UsXHJcbiAgSG9tZVNlYXJjaFJlc3VsdCxcclxuICBUZW1wbGF0ZUZyYWdtZW50LFxyXG59IGZyb20gJ0BvcGVuZmluL3dvcmtzcGFjZSc7XHJcbmltcG9ydCB0eXBlIHsgQ3VzdG9tUGFsZXR0ZVNldCwgV29ya3NwYWNlLCBXb3Jrc3BhY2VQbGF0Zm9ybU1vZHVsZSB9IGZyb20gJ0BvcGVuZmluL3dvcmtzcGFjZS1wbGF0Zm9ybSc7XHJcbmltcG9ydCB0eXBlIHsgV29ya3NwYWNlQ2hhbmdlZExpZmVjeWNsZVBheWxvYWQgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgSW50ZWdyYXRpb25IZWxwZXJzLCBJbnRlZ3JhdGlvbk1vZHVsZSB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL2ludGVncmF0aW9ucy1zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IExvZ2dlciwgTG9nZ2VyQ3JlYXRvciB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL2xvZ2dlci1zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IE1vZHVsZURlZmluaXRpb24gfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy9tb2R1bGUtc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBDb2xvclNjaGVtZU1vZGUgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy90aGVtZS1zaGFwZXMnO1xyXG5pbXBvcnQgeyByYW5kb21VVUlEIH0gZnJvbSAnLi4vLi4vLi4vZnJhbWV3b3JrL3V1aWQnO1xyXG5pbXBvcnQgdHlwZSB7IFdvcmtzcGFjZXNTZXR0aW5ncyB9IGZyb20gJy4vc2hhcGVzJztcclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnQgdGhlIGludGVncmF0aW9uIHByb3ZpZGVyIGZvciB3b3Jrc3BhY2VzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFdvcmtzcGFjZXNQcm92aWRlciBpbXBsZW1lbnRzIEludGVncmF0aW9uTW9kdWxlPFdvcmtzcGFjZXNTZXR0aW5ncz4ge1xyXG4gIC8qKlxyXG4gICAqIFByb3ZpZGVyIGlkLlxyXG4gICAqIEBpbnRlcm5hbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9QUk9WSURFUl9JRCA9ICd3b3Jrc3BhY2VzJztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGtleSB0byB1c2UgZm9yIG9wZW5pbmcgYSB3b3Jrc3BhY2UuXHJcbiAgICogQGludGVybmFsXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX0FDVElPTl9PUEVOX1dPUktTUEFDRSA9ICdPcGVuIFdvcmtzcGFjZSc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBrZXkgdG8gdXNlIGZvciBkZWxldGluZyBhIHdvcmtzcGFjZS5cclxuICAgKiBAaW50ZXJuYWxcclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfQUNUSU9OX0RFTEVURV9XT1JLU1BBQ0UgPSAnRGVsZXRlIFdvcmtzcGFjZSc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBrZXkgdG8gdXNlIGZvciBzaGFyaW5nIGEgd29ya3NwYWNlLlxyXG4gICAqIEBpbnRlcm5hbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9BQ1RJT05fU0hBUkVfV09SS1NQQUNFID0gJ1NoYXJlIFdvcmtzcGFjZSc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBrZXkgdG8gdXNlIGZvciBzYXZpbmcgYSB3b3Jrc3BhY2UuXHJcbiAgICogQGludGVybmFsXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX0FDVElPTl9TQVZFX1dPUktTUEFDRSA9ICdTYXZlIFdvcmtzcGFjZSc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBrZXkgdG8gdXNlIGZvciBhIHdvcmtzcGFjZSBleGlzdHMuXHJcbiAgICogQGludGVybmFsXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX0FDVElPTl9FWElTVFNfV09SS1NQQUNFID0gJ1dvcmtzcGFjZSBFeGlzdHMnO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgc2V0dGluZ3MgZnJvbSBjb25maWcuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfc2V0dGluZ3M6IFdvcmtzcGFjZXNTZXR0aW5ncztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNldHRpbmdzIGZvciB0aGUgaW50ZWdyYXRpb24uXHJcbiAgICogQGludGVybmFsXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfbG9nZ2VyOiBMb2dnZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBpbnRlZ3JhdGlvbiBoZWxwZXJzLlxyXG4gICAqIEBpbnRlcm5hbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2ludGVncmF0aW9uSGVscGVyczogSW50ZWdyYXRpb25IZWxwZXJzIHwgdW5kZWZpbmVkO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgbGFzdCBzZWFyY2ggcmVzcG9uc2UuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfbGFzdFJlc3BvbnNlPzogSG9tZVNlYXJjaExpc3RlbmVyUmVzcG9uc2U7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBsYXN0IHF1ZXJ5LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2xhc3RRdWVyeT86IHN0cmluZztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGxhc3QgcXVlcnkgbWluIGxlbmd0aC5cclxuICAgKi9cclxuICBwcml2YXRlIF9sYXN0UXVlcnlNaW5MZW5ndGg/OiBudW1iZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBsYXN0IHJlc3VsdHMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfbGFzdFJlc3VsdHM/OiBIb21lU2VhcmNoUmVzdWx0W107XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemUgdGhlIG1vZHVsZS5cclxuICAgKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgbW9kdWxlIGZyb20gY29uZmlndXJhdGlvbiBpbmNsdWRlIGN1c3RvbSBvcHRpb25zLlxyXG4gICAqIEBwYXJhbSBsb2dnZXJDcmVhdG9yIEZvciBsb2dnaW5nIGVudHJpZXMuXHJcbiAgICogQHBhcmFtIGhlbHBlcnMgSGVscGVyIG1ldGhvZHMgZm9yIHRoZSBtb2R1bGUgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgYXBwbGljYXRpb24gY29yZS5cclxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBpbml0aWFsaXplKGRlZmluaXRpb246IE1vZHVsZURlZmluaXRpb248V29ya3NwYWNlc1NldHRpbmdzPiwgbG9nZ2VyQ3JlYXRvcjogTG9nZ2VyQ3JlYXRvciwgaGVscGVyczogSW50ZWdyYXRpb25IZWxwZXJzKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICB0aGlzLl9zZXR0aW5ncyA9IGRlZmluaXRpb24uZGF0YTtcclxuICAgIHRoaXMuX2ludGVncmF0aW9uSGVscGVycyA9IGhlbHBlcnM7XHJcbiAgICB0aGlzLl9sb2dnZXIgPSBsb2dnZXJDcmVhdG9yKCdXb3Jrc3BhY2VzUHJvdmlkZXInKTtcclxuXHJcbiAgICB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuc3Vic2NyaWJlTGlmZWN5Y2xlRXZlbnQoJ3dvcmtzcGFjZS1jaGFuZ2VkJywgYXN5bmMgKHBsYXRmb3JtOiBXb3Jrc3BhY2VQbGF0Zm9ybU1vZHVsZSwgcGF5bG9hZDogV29ya3NwYWNlQ2hhbmdlZExpZmVjeWNsZVBheWxvYWQpID0+IHtcclxuICAgICAgaWYgKHBheWxvYWQuYWN0aW9uID09PSAnY3JlYXRlJykge1xyXG4gICAgICAgIGlmICghdGhpcy5fbGFzdFF1ZXJ5LnN0YXJ0c1dpdGgoJy93ICcpKSB7XHJcbiAgICAgICAgICBhd2FpdCB0aGlzLnJlYnVpbGRSZXN1bHRzKHBsYXRmb3JtKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAocGF5bG9hZC5hY3Rpb24gPT09ICd1cGRhdGUnKSB7XHJcbiAgICAgICAgY29uc3QgbGFzdFJlc3VsdCA9IHRoaXMuX2xhc3RSZXN1bHRzPy5maW5kKChyZXMpID0+IHJlcy5rZXkgPT09IHBheWxvYWQuaWQpO1xyXG4gICAgICAgIGlmIChsYXN0UmVzdWx0KSB7XHJcbiAgICAgICAgICBsYXN0UmVzdWx0LnRpdGxlID0gcGF5bG9hZC53b3Jrc3BhY2UudGl0bGU7XHJcbiAgICAgICAgICBsYXN0UmVzdWx0LmRhdGEud29ya3NwYWNlVGl0bGUgPSBwYXlsb2FkLndvcmtzcGFjZS50aXRsZTtcclxuICAgICAgICAgIChsYXN0UmVzdWx0LnRlbXBsYXRlQ29udGVudCBhcyBDdXN0b21UZW1wbGF0ZSkuZGF0YS50aXRsZSA9IHBheWxvYWQud29ya3NwYWNlLnRpdGxlO1xyXG4gICAgICAgICAgdGhpcy5yZXN1bHRBZGRVcGRhdGUoW2xhc3RSZXN1bHRdKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAocGF5bG9hZC5hY3Rpb24gPT09ICdkZWxldGUnKSB7XHJcbiAgICAgICAgdGhpcy5yZXN1bHRSZW1vdmUocGF5bG9hZC5pZCBhcyBzdHJpbmcpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5zdWJzY3JpYmVMaWZlY3ljbGVFdmVudCgndGhlbWUtY2hhbmdlZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcGxhdGZvcm06IFdvcmtzcGFjZVBsYXRmb3JtTW9kdWxlID0gdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldFBsYXRmb3JtKCk7XHJcbiAgICAgIGF3YWl0IHRoaXMucmVidWlsZFJlc3VsdHMocGxhdGZvcm0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgYSBsaXN0IG9mIHRoZSBzdGF0aWMgaGVscCBlbnRyaWVzLlxyXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGhlbHAgZW50cmllcy5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgZ2V0SGVscFNlYXJjaEVudHJpZXMoKTogUHJvbWlzZTxIb21lU2VhcmNoUmVzdWx0W10+IHtcclxuICAgIGNvbnN0IGNvbG9yU2NoZW1lID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldEN1cnJlbnRDb2xvclNjaGVtZU1vZGUoKTtcclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICB7XHJcbiAgICAgICAga2V5OiBgJHtXb3Jrc3BhY2VzUHJvdmlkZXIuX1BST1ZJREVSX0lEfS1oZWxwMWAsXHJcbiAgICAgICAgdGl0bGU6ICdXb3Jrc3BhY2VzJyxcclxuICAgICAgICBsYWJlbDogJ0hlbHAnLFxyXG4gICAgICAgIGljb246IHRoaXMuX3NldHRpbmdzLmltYWdlcy53b3Jrc3BhY2UucmVwbGFjZSgne3NjaGVtZX0nLCBjb2xvclNjaGVtZSBhcyBzdHJpbmcpLFxyXG4gICAgICAgIGFjdGlvbnM6IFtdLFxyXG4gICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgIHByb3ZpZGVySWQ6IFdvcmtzcGFjZXNQcm92aWRlci5fUFJPVklERVJfSUQsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0ZW1wbGF0ZTogJ0N1c3RvbScgYXMgQ0xJVGVtcGxhdGUuQ3VzdG9tLFxyXG4gICAgICAgIHRlbXBsYXRlQ29udGVudDogYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLnRlbXBsYXRlSGVscGVycy5jcmVhdGVIZWxwKCdXb3Jrc3BhY2VzJywgWydVc2UgdGhlIHdvcmtzcGFjZXMgY29tbWFuZCB0byBzYXZlIHlvdXIgY3VycmVudCBsYXlvdXQuJ10sIFsnL3cgdGl0bGUnXSksXHJcbiAgICAgIH0sXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgbGlzdCBvZiBzZWFyY2ggcmVzdWx0cyBiYXNlZCBvbiB0aGUgcXVlcnkgYW5kIGZpbHRlcnMuXHJcbiAgICogQHBhcmFtIHF1ZXJ5IFRoZSBxdWVyeSB0byBzZWFyY2ggZm9yLlxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzIFRoZSBmaWx0ZXJzIHRvIGFwcGx5LlxyXG4gICAqIEBwYXJhbSBsYXN0UmVzcG9uc2UgVGhlIGxhc3Qgc2VhcmNoIHJlc3BvbnNlIHVzZWQgZm9yIHVwZGF0aW5nIGV4aXN0aW5nIHJlc3VsdHMuXHJcbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIHNlYXJjaCBxdWVyeS5cclxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiByZXN1bHRzIGFuZCBuZXcgZmlsdGVycy5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgZ2V0U2VhcmNoUmVzdWx0cyhcclxuICAgIHF1ZXJ5OiBzdHJpbmcsXHJcbiAgICBmaWx0ZXJzOiBDTElGaWx0ZXJbXSxcclxuICAgIGxhc3RSZXNwb25zZTogSG9tZVNlYXJjaExpc3RlbmVyUmVzcG9uc2UsXHJcbiAgICBvcHRpb25zOiB7XHJcbiAgICAgIHF1ZXJ5TWluTGVuZ3RoOiBudW1iZXI7XHJcbiAgICAgIHF1ZXJ5QWdhaW5zdDogc3RyaW5nW107XHJcbiAgICB9LFxyXG4gICk6IFByb21pc2U8SG9tZVNlYXJjaFJlc3BvbnNlPiB7XHJcbiAgICBjb25zdCBwbGF0Zm9ybTogV29ya3NwYWNlUGxhdGZvcm1Nb2R1bGUgPSB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuZ2V0UGxhdGZvcm0oKTtcclxuICAgIGNvbnN0IHdvcmtzcGFjZXM6IFdvcmtzcGFjZVtdID0gYXdhaXQgcGxhdGZvcm0uU3RvcmFnZS5nZXRXb3Jrc3BhY2VzKCk7XHJcbiAgICBjb25zdCBjb2xvclNjaGVtZSA9IGF3YWl0IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRDdXJyZW50Q29sb3JTY2hlbWVNb2RlKCk7XHJcblxyXG4gICAgY29uc3QgcXVlcnlMb3dlciA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgdGhpcy5fbGFzdFJlc3BvbnNlID0gbGFzdFJlc3BvbnNlO1xyXG4gICAgdGhpcy5fbGFzdFF1ZXJ5ID0gcXVlcnlMb3dlcjtcclxuICAgIHRoaXMuX2xhc3RRdWVyeU1pbkxlbmd0aCA9IG9wdGlvbnMucXVlcnlNaW5MZW5ndGg7XHJcblxyXG4gICAgaWYgKHF1ZXJ5TG93ZXIuc3RhcnRzV2l0aCgnL3cgJykpIHtcclxuICAgICAgY29uc3QgdGl0bGUgPSBxdWVyeUxvd2VyLnJlcGxhY2UoJy93ICcsICcnKTtcclxuXHJcbiAgICAgIGNvbnN0IGZvdW5kTWF0Y2ggPSB3b3Jrc3BhY2VzLmZpbmQoKGVudHJ5KSA9PiBlbnRyeS50aXRsZS50b0xvd2VyQ2FzZSgpID09PSB0aXRsZS50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgaWYgKGZvdW5kTWF0Y2gpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgcmVzdWx0czogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAga2V5OiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9FWElTVFNfV09SS1NQQUNFLFxyXG4gICAgICAgICAgICAgIHRpdGxlOiBgV29ya3NwYWNlICR7Zm91bmRNYXRjaC50aXRsZX0gYWxyZWFkeSBleGlzdHMuYCxcclxuICAgICAgICAgICAgICBpY29uOiB0aGlzLl9zZXR0aW5ncy5pbWFnZXMud29ya3NwYWNlLnJlcGxhY2UoJ3tzY2hlbWV9JywgY29sb3JTY2hlbWUgYXMgc3RyaW5nKSxcclxuICAgICAgICAgICAgICBhY3Rpb25zOiBbXSxcclxuICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBwcm92aWRlcklkOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX1BST1ZJREVSX0lELFxyXG4gICAgICAgICAgICAgICAgdGFnczogWyd3b3Jrc3BhY2UnXSxcclxuICAgICAgICAgICAgICAgIHdvcmtzcGFjZUlkOiBmb3VuZE1hdGNoLndvcmtzcGFjZUlkLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgdGVtcGxhdGU6IG51bGwsXHJcbiAgICAgICAgICAgICAgdGVtcGxhdGVDb250ZW50OiBudWxsLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzdWx0czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBrZXk6IFdvcmtzcGFjZXNQcm92aWRlci5fQUNUSU9OX1NBVkVfV09SS1NQQUNFLFxyXG4gICAgICAgICAgICB0aXRsZTogYFNhdmUgQ3VycmVudCBXb3Jrc3BhY2UgYXMgJHt0aXRsZX1gLFxyXG4gICAgICAgICAgICBpY29uOiB0aGlzLl9zZXR0aW5ncy5pbWFnZXMud29ya3NwYWNlLnJlcGxhY2UoJ3tzY2hlbWV9JywgY29sb3JTY2hlbWUgYXMgc3RyaW5nKSxcclxuICAgICAgICAgICAgbGFiZWw6ICdTdWdnZXN0aW9uJyxcclxuICAgICAgICAgICAgYWN0aW9uczogW3sgbmFtZTogJ1NhdmUgV29ya3NwYWNlJywgaG90a2V5OiAnRW50ZXInIH1dLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgcHJvdmlkZXJJZDogV29ya3NwYWNlc1Byb3ZpZGVyLl9QUk9WSURFUl9JRCxcclxuICAgICAgICAgICAgICB0YWdzOiBbJ3dvcmtzcGFjZSddLFxyXG4gICAgICAgICAgICAgIHdvcmtzcGFjZUlkOiByYW5kb21VVUlEKCksXHJcbiAgICAgICAgICAgICAgd29ya3NwYWNlVGl0bGU6IHRpdGxlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogbnVsbCxcclxuICAgICAgICAgICAgdGVtcGxhdGVDb250ZW50OiBudWxsLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHdvcmtzcGFjZVJlc3VsdHM6IEhvbWVTZWFyY2hSZXN1bHRbXSA9IGF3YWl0IHRoaXMuYnVpbGRSZXN1bHRzKHBsYXRmb3JtLCB3b3Jrc3BhY2VzLCBxdWVyeUxvd2VyLCBvcHRpb25zLnF1ZXJ5TWluTGVuZ3RoLCBjb2xvclNjaGVtZSk7XHJcblxyXG4gICAgdGhpcy5fbGFzdFJlc3VsdHMgPSB3b3Jrc3BhY2VSZXN1bHRzO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3VsdHM6IHdvcmtzcGFjZVJlc3VsdHMsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQW4gZW50cnkgaGFzIGJlZW4gc2VsZWN0ZWQuXHJcbiAgICogQHBhcmFtIHJlc3VsdCBUaGUgZGlzcGF0Y2hlZCByZXN1bHQuXHJcbiAgICogQHBhcmFtIGxhc3RSZXNwb25zZSBUaGUgbGFzdCByZXNwb25zZS5cclxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBpdGVtIHdhcyBoYW5kbGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBpdGVtU2VsZWN0aW9uKHJlc3VsdDogSG9tZURpc3BhdGNoZWRTZWFyY2hSZXN1bHQsIGxhc3RSZXNwb25zZTogSG9tZVNlYXJjaExpc3RlbmVyUmVzcG9uc2UpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIGxldCBoYW5kbGVkID0gZmFsc2U7XHJcbiAgICBpZiAocmVzdWx0LmFjdGlvbi50cmlnZ2VyID09PSAndXNlci1hY3Rpb24nKSB7XHJcbiAgICAgIGNvbnN0IGRhdGE6IHtcclxuICAgICAgICB3b3Jrc3BhY2VJZD86IHN0cmluZztcclxuICAgICAgICB3b3Jrc3BhY2VUaXRsZT86IHN0cmluZztcclxuICAgICAgfSA9IHJlc3VsdC5kYXRhO1xyXG5cclxuICAgICAgaWYgKGRhdGE/LndvcmtzcGFjZUlkKSB7XHJcbiAgICAgICAgaGFuZGxlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmIChyZXN1bHQua2V5ID09PSBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9TQVZFX1dPUktTUEFDRSkge1xyXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzYXZlIHdvcmtzcGFjZSBlbnRyeVxyXG4gICAgICAgICAgdGhpcy5yZXN1bHRSZW1vdmUocmVzdWx0LmtleSk7XHJcblxyXG4gICAgICAgICAgY29uc3QgcGxhdGZvcm06IFdvcmtzcGFjZVBsYXRmb3JtTW9kdWxlID0gdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldFBsYXRmb3JtKCk7XHJcbiAgICAgICAgICBjb25zdCBzbmFwc2hvdCA9IGF3YWl0IHBsYXRmb3JtLmdldFNuYXBzaG90KCk7XHJcbiAgICAgICAgICBjb25zdCBjdXJyZW50V29ya3NwYWNlID0gYXdhaXQgcGxhdGZvcm0uZ2V0Q3VycmVudFdvcmtzcGFjZSgpO1xyXG4gICAgICAgICAgY29uc3QgY3VycmVudE1ldGFEYXRhID0gY3VycmVudFdvcmtzcGFjZT8ubWV0YWRhdGE7XHJcblxyXG4gICAgICAgICAgY29uc3Qgd29ya3NwYWNlID0ge1xyXG4gICAgICAgICAgICB3b3Jrc3BhY2VJZDogZGF0YS53b3Jrc3BhY2VJZCxcclxuICAgICAgICAgICAgdGl0bGU6IGRhdGEud29ya3NwYWNlVGl0bGUsXHJcbiAgICAgICAgICAgIG1ldGFkYXRhOiBjdXJyZW50TWV0YURhdGEsXHJcbiAgICAgICAgICAgIHNuYXBzaG90LFxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBhd2FpdCBwbGF0Zm9ybS5TdG9yYWdlLnNhdmVXb3Jrc3BhY2Uod29ya3NwYWNlKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBzaGFyZUVuYWJsZWQ6IGJvb2xlYW4gPSBhd2FpdCB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuY29uZGl0aW9uKCdzaGFyaW5nJyk7XHJcbiAgICAgICAgICBjb25zdCBwYWxldHRlOiBDdXN0b21QYWxldHRlU2V0ID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldEN1cnJlbnRQYWxldHRlKCk7XHJcbiAgICAgICAgICBjb25zdCBjb2xvclNjaGVtZSA9IGF3YWl0IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRDdXJyZW50Q29sb3JTY2hlbWVNb2RlKCk7XHJcblxyXG4gICAgICAgICAgY29uc3Qgc2F2ZWRXb3Jrc3BhY2UgPSB0aGlzLmdldFdvcmtzcGFjZVRlbXBsYXRlKHdvcmtzcGFjZS53b3Jrc3BhY2VJZCwgd29ya3NwYWNlLnRpdGxlLCBzaGFyZUVuYWJsZWQsIHRydWUsIGNvbG9yU2NoZW1lLCBwYWxldHRlKTtcclxuXHJcbiAgICAgICAgICAvLyBBbmQgYWRkIHRoZSBuZXcgb25lXHJcbiAgICAgICAgICB0aGlzLnJlc3VsdEFkZFVwZGF0ZShbc2F2ZWRXb3Jrc3BhY2VdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5rZXkgPT09IFdvcmtzcGFjZXNQcm92aWRlci5fQUNUSU9OX0VYSVNUU19XT1JLU1BBQ0UpIHtcclxuICAgICAgICAgIC8vIERvIG5vdGhpbmcsIHRoZSB1c2VyIG11c3QgdXBkYXRlIHRoZSBxdWVyeSB0byBnaXZlIGl0IGEgZGlmZmVyZW50XHJcbiAgICAgICAgICAvLyBuYW1lIHdoaWNoIHdpbGwgYXV0b21hdGljYWxseSByZWZyZXNoIHRoZSByZXN1bHRzXHJcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuYWN0aW9uLm5hbWUgPT09IFdvcmtzcGFjZXNQcm92aWRlci5fQUNUSU9OX09QRU5fV09SS1NQQUNFKSB7XHJcbiAgICAgICAgICBjb25zdCBwbGF0Zm9ybTogV29ya3NwYWNlUGxhdGZvcm1Nb2R1bGUgPSB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuZ2V0UGxhdGZvcm0oKTtcclxuICAgICAgICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IHBsYXRmb3JtLlN0b3JhZ2UuZ2V0V29ya3NwYWNlKGRhdGEud29ya3NwYWNlSWQpO1xyXG4gICAgICAgICAgYXdhaXQgcGxhdGZvcm0uYXBwbHlXb3Jrc3BhY2Uod29ya3NwYWNlKTtcclxuICAgICAgICAgIC8vIFdlIHJlYnVpbGQgdGhlIHJlc3VsdHMgaGVyZSBhcyB3ZSB3aWxsIG5vdyBoYXZlIGEgbmV3IGN1cnJlbnQgd29ya3NwYWNlXHJcbiAgICAgICAgICAvLyBhbmQgd2UgbmVlZCB0byBjaGFuZ2UgdGhlIGV4aXN0aW5nIG9uZSBiYWNrIHRvIGEgc3RhbmRhcmQgdGVtcGxhdGVcclxuICAgICAgICAgIGF3YWl0IHRoaXMucmVidWlsZFJlc3VsdHMocGxhdGZvcm0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbi5uYW1lID09PSBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9ERUxFVEVfV09SS1NQQUNFKSB7XHJcbiAgICAgICAgICBjb25zdCBwbGF0Zm9ybSA9IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRQbGF0Zm9ybSgpO1xyXG4gICAgICAgICAgYXdhaXQgcGxhdGZvcm0uU3RvcmFnZS5kZWxldGVXb3Jrc3BhY2UoZGF0YS53b3Jrc3BhY2VJZCk7XHJcbiAgICAgICAgICAvLyBEZWxldGluZyB0aGUgd29ya2luZyB3aWxsIGV2ZW50dWFsbHkgdHJpZ2dlciB0aGUgXCJkZWxldGVcIiBsaWZlY3ljbGVcclxuICAgICAgICAgIC8vIGV2ZW50IHdoaWNoIHdpbGwgcmVtb3ZlIGl0IGZyb20gdGhlIHJlc3VsdCBsaXN0XHJcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuYWN0aW9uLm5hbWUgPT09IFdvcmtzcGFjZXNQcm92aWRlci5fQUNUSU9OX1NIQVJFX1dPUktTUEFDRSkge1xyXG4gICAgICAgICAgYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLnNoYXJlKHsgd29ya3NwYWNlSWQ6IGRhdGEud29ya3NwYWNlSWQgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGhhbmRsZWQgPSBmYWxzZTtcclxuICAgICAgICAgIHRoaXMuX2xvZ2dlci53YXJuKGBVbnJlY29nbml6ZWQgYWN0aW9uIGZvciB3b3Jrc3BhY2Ugc2VsZWN0aW9uOiAke2RhdGEud29ya3NwYWNlSWR9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhhbmRsZWQ7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldFdvcmtzcGFjZVRlbXBsYXRlKGlkOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHNoYXJlRW5hYmxlZDogYm9vbGVhbiwgaXNDdXJyZW50OiBib29sZWFuLCBjb2xvclNjaGVtZTogQ29sb3JTY2hlbWVNb2RlLCBwYWxldHRlOiBDdXN0b21QYWxldHRlU2V0KTogSG9tZVNlYXJjaFJlc3VsdCB7XHJcbiAgICBsZXQgYWN0aW9ucyA9IFtdO1xyXG4gICAgbGV0IGxheW91dDtcclxuICAgIGxldCBkYXRhO1xyXG5cclxuICAgIGlmIChpc0N1cnJlbnQpIHtcclxuICAgICAgbGF5b3V0ID0gdGhpcy5nZXRPdGhlcldvcmtzcGFjZVRlbXBsYXRlKHNoYXJlRW5hYmxlZCwgZmFsc2UsIHBhbGV0dGUpO1xyXG4gICAgICBkYXRhID0ge1xyXG4gICAgICAgIHRpdGxlLFxyXG4gICAgICAgIGluc3RydWN0aW9uczogJ1RoaXMgaXMgdGhlIGN1cnJlbnRseSBhY3RpdmUgd29ya3NwYWNlLiBZb3UgY2FuIHVzZSB0aGUgQnJvd3NlciBtZW51IHRvIHVwZGF0ZS9yZW5hbWUgdGhpcyB3b3Jrc3BhY2UnLFxyXG4gICAgICAgIG9wZW5UZXh0OiAnT3BlbicsXHJcbiAgICAgICAgc2hhcmVUZXh0OiAnU2hhcmUnLFxyXG4gICAgICB9O1xyXG4gICAgICBpZiAoc2hhcmVFbmFibGVkKSB7XHJcbiAgICAgICAgYWN0aW9ucy5wdXNoKHtcclxuICAgICAgICAgIG5hbWU6IFdvcmtzcGFjZXNQcm92aWRlci5fQUNUSU9OX1NIQVJFX1dPUktTUEFDRSxcclxuICAgICAgICAgIGhvdGtleTogJ0NtZE9yQ3RybCtTaGlmdCtTJyxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBhY3Rpb25zID0gYWN0aW9ucy5jb25jYXQoW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIG5hbWU6IFdvcmtzcGFjZXNQcm92aWRlci5fQUNUSU9OX09QRU5fV09SS1NQQUNFLFxyXG4gICAgICAgICAgaG90a2V5OiAnRW50ZXInLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHNoYXJlRW5hYmxlZCkge1xyXG4gICAgICAgIGFjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgICBuYW1lOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9TSEFSRV9XT1JLU1BBQ0UsXHJcbiAgICAgICAgICBob3RrZXk6ICdDbWRPckN0cmwrU2hpZnQrUycsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBuYW1lOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9ERUxFVEVfV09SS1NQQUNFLFxyXG4gICAgICAgICAgaG90a2V5OiAnQ21kT3JDdHJsK1NoaWZ0K0QnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fT1BFTl9XT1JLU1BBQ0UsXHJcbiAgICAgICAgICBob3RrZXk6ICdFbnRlcicsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSk7XHJcbiAgICAgIGxheW91dCA9IHRoaXMuZ2V0T3RoZXJXb3Jrc3BhY2VUZW1wbGF0ZShzaGFyZUVuYWJsZWQsIHRydWUsIHBhbGV0dGUpO1xyXG4gICAgICBkYXRhID0ge1xyXG4gICAgICAgIHRpdGxlLFxyXG4gICAgICAgIGluc3RydWN0aW9uczogJ1VzZSB0aGUgYnV0dG9ucyBiZWxvdyB0byBpbnRlcmFjdCB3aXRoIHlvdXIgc2F2ZWQgd29ya3NwYWNlJyxcclxuICAgICAgICBvcGVuVGV4dDogJ09wZW4nLFxyXG4gICAgICAgIGRlbGV0ZVRleHQ6ICdEZWxldGUnLFxyXG4gICAgICAgIHNoYXJlVGV4dDogJ1NoYXJlJyxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBrZXk6IGlkLFxyXG4gICAgICB0aXRsZSxcclxuICAgICAgbGFiZWw6ICdXb3Jrc3BhY2UnLFxyXG4gICAgICBpY29uOiB0aGlzLl9zZXR0aW5ncy5pbWFnZXMud29ya3NwYWNlLnJlcGxhY2UoJ3tzY2hlbWV9JywgY29sb3JTY2hlbWUgYXMgc3RyaW5nKSxcclxuICAgICAgYWN0aW9ucyxcclxuICAgICAgZGF0YToge1xyXG4gICAgICAgIHByb3ZpZGVySWQ6IFdvcmtzcGFjZXNQcm92aWRlci5fUFJPVklERVJfSUQsXHJcbiAgICAgICAgd29ya3NwYWNlVGl0bGU6IHRpdGxlLFxyXG4gICAgICAgIHdvcmtzcGFjZUlkOiBpZCxcclxuICAgICAgICB0YWdzOiBbJ3dvcmtzcGFjZSddLFxyXG4gICAgICB9LFxyXG4gICAgICB0ZW1wbGF0ZTogJ0N1c3RvbScgYXMgQ0xJVGVtcGxhdGUuQ3VzdG9tLFxyXG4gICAgICB0ZW1wbGF0ZUNvbnRlbnQ6IHtcclxuICAgICAgICBsYXlvdXQsXHJcbiAgICAgICAgZGF0YSxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldE90aGVyV29ya3NwYWNlVGVtcGxhdGUoZW5hYmxlU2hhcmU6IGJvb2xlYW4sIGVuYWJsZURlbGV0ZTogYm9vbGVhbiwgcGFsZXR0ZTogQ3VzdG9tUGFsZXR0ZVNldCk6IFRlbXBsYXRlRnJhZ21lbnQge1xyXG4gICAgY29uc3QgYWN0aW9uQnV0dG9uczogVGVtcGxhdGVGcmFnbWVudFtdID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgdHlwZTogJ0J1dHRvbicsXHJcbiAgICAgICAgYWN0aW9uOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9PUEVOX1dPUktTUEFDRSxcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnVGV4dCcsXHJcbiAgICAgICAgICAgIGRhdGFLZXk6ICdvcGVuVGV4dCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0sXHJcbiAgICBdO1xyXG5cclxuICAgIGlmIChlbmFibGVEZWxldGUpIHtcclxuICAgICAgYWN0aW9uQnV0dG9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnQnV0dG9uJyxcclxuICAgICAgICBidXR0b25TdHlsZTogJ3ByaW1hcnknIGFzIEJ1dHRvblN0eWxlLlByaW1hcnksXHJcbiAgICAgICAgYWN0aW9uOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9ERUxFVEVfV09SS1NQQUNFLFxyXG4gICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdUZXh0JyxcclxuICAgICAgICAgICAgZGF0YUtleTogJ2RlbGV0ZVRleHQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZW5hYmxlU2hhcmUpIHtcclxuICAgICAgYWN0aW9uQnV0dG9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnQnV0dG9uJyxcclxuICAgICAgICBidXR0b25TdHlsZTogJ3ByaW1hcnknIGFzIEJ1dHRvblN0eWxlLlByaW1hcnksXHJcbiAgICAgICAgYWN0aW9uOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9TSEFSRV9XT1JLU1BBQ0UsXHJcbiAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ1RleHQnLFxyXG4gICAgICAgICAgICBkYXRhS2V5OiAnc2hhcmVUZXh0JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ0NvbnRhaW5lcicsXHJcbiAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgcGFkZGluZzogJzEwcHgnLFxyXG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcclxuICAgICAgICBmbGV4OiAxLFxyXG4gICAgICB9LFxyXG4gICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHR5cGU6ICdUZXh0JyxcclxuICAgICAgICAgIGRhdGFLZXk6ICd0aXRsZScsXHJcbiAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBmb250V2VpZ2h0OiAnYm9sZCcsXHJcbiAgICAgICAgICAgIGZvbnRTaXplOiAnMTZweCcsXHJcbiAgICAgICAgICAgIHBhZGRpbmdCb3R0b206ICc1cHgnLFxyXG4gICAgICAgICAgICBtYXJnaW5Cb3R0b206ICcxMHB4JyxcclxuICAgICAgICAgICAgYm9yZGVyQm90dG9tOiBgMXB4IHNvbGlkICR7cGFsZXR0ZS5iYWNrZ3JvdW5kNn1gLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHR5cGU6ICdUZXh0JyxcclxuICAgICAgICAgIGRhdGFLZXk6ICdpbnN0cnVjdGlvbnMnLFxyXG4gICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgZmxleDogMSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0eXBlOiAnQ29udGFpbmVyJyxcclxuICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICBnYXA6ICcxMHB4JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBjaGlsZHJlbjogYWN0aW9uQnV0dG9ucyxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgcmVidWlsZFJlc3VsdHMocGxhdGZvcm06IFdvcmtzcGFjZVBsYXRmb3JtTW9kdWxlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBjb2xvclNjaGVtZSA9IGF3YWl0IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRDdXJyZW50Q29sb3JTY2hlbWVNb2RlKCk7XHJcblxyXG4gICAgY29uc3Qgd29ya3NwYWNlczogV29ya3NwYWNlW10gPSBhd2FpdCBwbGF0Zm9ybS5TdG9yYWdlLmdldFdvcmtzcGFjZXMoKTtcclxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLmJ1aWxkUmVzdWx0cyhwbGF0Zm9ybSwgd29ya3NwYWNlcywgdGhpcy5fbGFzdFF1ZXJ5LCB0aGlzLl9sYXN0UXVlcnlNaW5MZW5ndGgsIGNvbG9yU2NoZW1lKTtcclxuICAgIHRoaXMucmVzdWx0QWRkVXBkYXRlKHJlc3VsdHMpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBidWlsZFJlc3VsdHMoXHJcbiAgICBwbGF0Zm9ybTogV29ya3NwYWNlUGxhdGZvcm1Nb2R1bGUsXHJcbiAgICB3b3Jrc3BhY2VzOiBXb3Jrc3BhY2VbXSxcclxuICAgIHF1ZXJ5OiBzdHJpbmcsXHJcbiAgICBxdWVyeU1pbkxlbmd0aDogbnVtYmVyLFxyXG4gICAgY29sb3JTY2hlbWU6IENvbG9yU2NoZW1lTW9kZSxcclxuICApOiBQcm9taXNlPEhvbWVTZWFyY2hSZXN1bHRbXT4ge1xyXG4gICAgbGV0IHJlc3VsdHM6IEhvbWVTZWFyY2hSZXN1bHRbXSA9IFtdO1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHdvcmtzcGFjZXMpKSB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRXb3Jrc3BhY2UgPSBhd2FpdCBwbGF0Zm9ybS5nZXRDdXJyZW50V29ya3NwYWNlKCk7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRXb3Jrc3BhY2VJZCA9IGN1cnJlbnRXb3Jrc3BhY2U/LndvcmtzcGFjZUlkO1xyXG4gICAgICBjb25zdCBzaGFyZUVuYWJsZWQ6IGJvb2xlYW4gPSBhd2FpdCB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuY29uZGl0aW9uKCdzaGFyaW5nJyk7XHJcbiAgICAgIGNvbnN0IHBhbGV0dGU6IEN1c3RvbVBhbGV0dGVTZXQgPSBhd2FpdCB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuZ2V0Q3VycmVudFBhbGV0dGUoKTtcclxuXHJcbiAgICAgIHJlc3VsdHMgPSB3b3Jrc3BhY2VzXHJcbiAgICAgICAgLmZpbHRlcigocGcpID0+IHF1ZXJ5Lmxlbmd0aCA9PT0gMCB8fCAocXVlcnkubGVuZ3RoID49IHF1ZXJ5TWluTGVuZ3RoICYmIHBnLnRpdGxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnkpKSlcclxuICAgICAgICAubWFwKCh3czogV29ya3NwYWNlLCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLmdldFdvcmtzcGFjZVRlbXBsYXRlKHdzLndvcmtzcGFjZUlkLCB3cy50aXRsZSwgc2hhcmVFbmFibGVkLCBjdXJyZW50V29ya3NwYWNlSWQgPT09IHdzLndvcmtzcGFjZUlkLCBjb2xvclNjaGVtZSwgcGFsZXR0ZSkpXHJcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEudGl0bGUubG9jYWxlQ29tcGFyZShiLnRpdGxlKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVzdWx0QWRkVXBkYXRlKHJlc3VsdHM6IEhvbWVTZWFyY2hSZXN1bHRbXSk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX2xhc3RSZXN1bHRzKSB7XHJcbiAgICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcclxuICAgICAgICBjb25zdCByZXN1bHRJbmRleCA9IHRoaXMuX2xhc3RSZXN1bHRzLmZpbmRJbmRleCgocmVzKSA9PiByZXMua2V5ID09PSByZXN1bHQua2V5KTtcclxuICAgICAgICBpZiAocmVzdWx0SW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgdGhpcy5fbGFzdFJlc3VsdHMuc3BsaWNlKHJlc3VsdEluZGV4LCAxLCByZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLl9sYXN0UmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fbGFzdFJlc3BvbnNlKSB7XHJcbiAgICAgIHRoaXMuX2xhc3RSZXNwb25zZS5yZXNwb25kKHJlc3VsdHMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZXN1bHRSZW1vdmUoaWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX2xhc3RSZXN1bHRzKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdEluZGV4ID0gdGhpcy5fbGFzdFJlc3VsdHMuZmluZEluZGV4KChyZXMpID0+IHJlcy5rZXkgPT09IGlkKTtcclxuICAgICAgaWYgKHJlc3VsdEluZGV4ID49IDApIHtcclxuICAgICAgICB0aGlzLl9sYXN0UmVzdWx0cy5zcGxpY2UocmVzdWx0SW5kZXgsIDEpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fbGFzdFJlc3BvbnNlKSB7XHJcbiAgICAgIHRoaXMuX2xhc3RSZXNwb25zZS5yZXZva2UoaWQpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IFdvcmtzcGFjZXNQcm92aWRlciB9IGZyb20gXCIuL2ludGVncmF0aW9uXCI7XHJcblxyXG5leHBvcnQgY29uc3QgZW50cnlQb2ludHM6IHsgW2lkOiBzdHJpbmddOiBXb3Jrc3BhY2VzUHJvdmlkZXIgfSA9IHtcclxuXHRpbnRlZ3JhdGlvbnM6IG5ldyBXb3Jrc3BhY2VzUHJvdmlkZXIoKVxyXG59O1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=