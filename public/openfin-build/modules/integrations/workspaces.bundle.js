/******/ var __webpack_modules__ = ({

/***/ "./client/src/framework/uuid.ts":
/*!**************************************!*\
  !*** ./client/src/framework/uuid.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "randomUUID": () => (/* binding */ randomUUID)
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
/* harmony export */   "WorkspacesProvider": () => (/* binding */ WorkspacesProvider)
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
/* harmony export */   "entryPoints": () => (/* binding */ entryPoints)
/* harmony export */ });
/* harmony import */ var _integration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./integration */ "./client/src/modules/integrations/workspaces/integration.ts");

const entryPoints = {
    integrations: new _integration__WEBPACK_IMPORTED_MODULE_0__.WorkspacesProvider()
};

})();

var __webpack_exports__entryPoints = __webpack_exports__.entryPoints;
export { __webpack_exports__entryPoints as entryPoints };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ozs7Ozs7QUNObUQ7QUFFNUMsTUFBTSxXQUFXLEdBQXlDO0lBQ2hFLFlBQVksRUFBRSxJQUFJLDREQUFrQixFQUFFO0NBQ3RDLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2UvLi9jbGllbnQvc3JjL2ZyYW1ld29yay91dWlkLnRzIiwid2VicGFjazovL25pcnZhbmFvcGVuZmluLXdvcmtzcGFjZS8uL2NsaWVudC9zcmMvbW9kdWxlcy9pbnRlZ3JhdGlvbnMvd29ya3NwYWNlcy9pbnRlZ3JhdGlvbi50cyIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbmlydmFuYW9wZW5maW4td29ya3NwYWNlL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2UvLi9jbGllbnQvc3JjL21vZHVsZXMvaW50ZWdyYXRpb25zL3dvcmtzcGFjZXMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbVVVSUQoKTogc3RyaW5nIHtcclxuXHRpZiAoXCJyYW5kb21VVUlEXCIgaW4gd2luZG93LmNyeXB0bykge1xyXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4XHJcblx0XHRyZXR1cm4gd2luZG93LmNyeXB0by5yYW5kb21VVUlEKCk7XHJcblx0fVxyXG5cdC8vIFBvbHlmaWxsIHRoZSB3aW5kb3cuY3J5cHRvLnJhbmRvbVVVSUQgaWYgd2UgYXJlIHJ1bm5pbmcgaW4gYSBub24gc2VjdXJlIGNvbnRleHQgdGhhdCBkb2Vzbid0IGhhdmUgaXRcclxuXHQvLyB3ZSBhcmUgc3RpbGwgdXNpbmcgd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMgd2hpY2ggaXMgYWx3YXlzIGF2YWlsYWJsZVxyXG5cdC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMTE3NTIzLzI4MDAyMThcclxuXHRjb25zdCBnZXRSYW5kb21IZXggPSAoYykgPT5cclxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1iaXR3aXNlLCBuby1taXhlZC1vcGVyYXRvcnNcclxuXHRcdChjIF4gKHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KDEpKVswXSAmICgxNSA+PiAoYyAvIDQpKSkpLnRvU3RyaW5nKDE2KTtcclxuXHRyZXR1cm4gXCIxMDAwMDAwMC0xMDAwLTQwMDAtODAwMC0xMDAwMDAwMDAwMDBcIi5yZXBsYWNlKC9bMDE4XS9nLCBnZXRSYW5kb21IZXgpO1xyXG59XHJcbiIsImltcG9ydCB0eXBlIHtcclxuICBCdXR0b25TdHlsZSxcclxuICBDTElGaWx0ZXIsXHJcbiAgQ0xJVGVtcGxhdGUsXHJcbiAgQ3VzdG9tVGVtcGxhdGUsXHJcbiAgSG9tZURpc3BhdGNoZWRTZWFyY2hSZXN1bHQsXHJcbiAgSG9tZVNlYXJjaExpc3RlbmVyUmVzcG9uc2UsXHJcbiAgSG9tZVNlYXJjaFJlc3BvbnNlLFxyXG4gIEhvbWVTZWFyY2hSZXN1bHQsXHJcbiAgVGVtcGxhdGVGcmFnbWVudCxcclxufSBmcm9tICdAb3BlbmZpbi93b3Jrc3BhY2UnO1xyXG5pbXBvcnQgdHlwZSB7IEN1c3RvbVBhbGV0dGVTZXQsIFdvcmtzcGFjZSwgV29ya3NwYWNlUGxhdGZvcm1Nb2R1bGUgfSBmcm9tICdAb3BlbmZpbi93b3Jrc3BhY2UtcGxhdGZvcm0nO1xyXG5pbXBvcnQgdHlwZSB7IFdvcmtzcGFjZUNoYW5nZWRMaWZlY3ljbGVQYXlsb2FkIH0gZnJvbSAnY3VzdG9taXplLXdvcmtzcGFjZS9zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IEludGVncmF0aW9uSGVscGVycywgSW50ZWdyYXRpb25Nb2R1bGUgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy9pbnRlZ3JhdGlvbnMtc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBMb2dnZXIsIExvZ2dlckNyZWF0b3IgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy9sb2dnZXItc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBNb2R1bGVEZWZpbml0aW9uIH0gZnJvbSAnY3VzdG9taXplLXdvcmtzcGFjZS9zaGFwZXMvbW9kdWxlLXNoYXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgQ29sb3JTY2hlbWVNb2RlIH0gZnJvbSAnY3VzdG9taXplLXdvcmtzcGFjZS9zaGFwZXMvdGhlbWUtc2hhcGVzJztcclxuaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gJy4uLy4uLy4uL2ZyYW1ld29yay91dWlkJztcclxuaW1wb3J0IHR5cGUgeyBXb3Jrc3BhY2VzU2V0dGluZ3MgfSBmcm9tICcuL3NoYXBlcyc7XHJcblxyXG4vKipcclxuICogSW1wbGVtZW50IHRoZSBpbnRlZ3JhdGlvbiBwcm92aWRlciBmb3Igd29ya3NwYWNlcy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBXb3Jrc3BhY2VzUHJvdmlkZXIgaW1wbGVtZW50cyBJbnRlZ3JhdGlvbk1vZHVsZTxXb3Jrc3BhY2VzU2V0dGluZ3M+IHtcclxuICAvKipcclxuICAgKiBQcm92aWRlciBpZC5cclxuICAgKiBAaW50ZXJuYWxcclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfUFJPVklERVJfSUQgPSAnd29ya3NwYWNlcyc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBrZXkgdG8gdXNlIGZvciBvcGVuaW5nIGEgd29ya3NwYWNlLlxyXG4gICAqIEBpbnRlcm5hbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9BQ1RJT05fT1BFTl9XT1JLU1BBQ0UgPSAnT3BlbiBXb3Jrc3BhY2UnO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUga2V5IHRvIHVzZSBmb3IgZGVsZXRpbmcgYSB3b3Jrc3BhY2UuXHJcbiAgICogQGludGVybmFsXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX0FDVElPTl9ERUxFVEVfV09SS1NQQUNFID0gJ0RlbGV0ZSBXb3Jrc3BhY2UnO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUga2V5IHRvIHVzZSBmb3Igc2hhcmluZyBhIHdvcmtzcGFjZS5cclxuICAgKiBAaW50ZXJuYWxcclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfQUNUSU9OX1NIQVJFX1dPUktTUEFDRSA9ICdTaGFyZSBXb3Jrc3BhY2UnO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUga2V5IHRvIHVzZSBmb3Igc2F2aW5nIGEgd29ya3NwYWNlLlxyXG4gICAqIEBpbnRlcm5hbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9BQ1RJT05fU0FWRV9XT1JLU1BBQ0UgPSAnU2F2ZSBXb3Jrc3BhY2UnO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUga2V5IHRvIHVzZSBmb3IgYSB3b3Jrc3BhY2UgZXhpc3RzLlxyXG4gICAqIEBpbnRlcm5hbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9BQ1RJT05fRVhJU1RTX1dPUktTUEFDRSA9ICdXb3Jrc3BhY2UgRXhpc3RzJztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNldHRpbmdzIGZyb20gY29uZmlnLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX3NldHRpbmdzOiBXb3Jrc3BhY2VzU2V0dGluZ3M7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBzZXR0aW5ncyBmb3IgdGhlIGludGVncmF0aW9uLlxyXG4gICAqIEBpbnRlcm5hbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2xvZ2dlcjogTG9nZ2VyO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgaW50ZWdyYXRpb24gaGVscGVycy5cclxuICAgKiBAaW50ZXJuYWxcclxuICAgKi9cclxuICBwcml2YXRlIF9pbnRlZ3JhdGlvbkhlbHBlcnM6IEludGVncmF0aW9uSGVscGVycyB8IHVuZGVmaW5lZDtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGxhc3Qgc2VhcmNoIHJlc3BvbnNlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2xhc3RSZXNwb25zZT86IEhvbWVTZWFyY2hMaXN0ZW5lclJlc3BvbnNlO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgbGFzdCBxdWVyeS5cclxuICAgKi9cclxuICBwcml2YXRlIF9sYXN0UXVlcnk/OiBzdHJpbmc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBsYXN0IHF1ZXJ5IG1pbiBsZW5ndGguXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfbGFzdFF1ZXJ5TWluTGVuZ3RoPzogbnVtYmVyO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgbGFzdCByZXN1bHRzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2xhc3RSZXN1bHRzPzogSG9tZVNlYXJjaFJlc3VsdFtdO1xyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplIHRoZSBtb2R1bGUuXHJcbiAgICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gb2YgdGhlIG1vZHVsZSBmcm9tIGNvbmZpZ3VyYXRpb24gaW5jbHVkZSBjdXN0b20gb3B0aW9ucy5cclxuICAgKiBAcGFyYW0gbG9nZ2VyQ3JlYXRvciBGb3IgbG9nZ2luZyBlbnRyaWVzLlxyXG4gICAqIEBwYXJhbSBoZWxwZXJzIEhlbHBlciBtZXRob2RzIGZvciB0aGUgbW9kdWxlIHRvIGludGVyYWN0IHdpdGggdGhlIGFwcGxpY2F0aW9uIGNvcmUuXHJcbiAgICogQHJldHVybnMgTm90aGluZy5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgaW5pdGlhbGl6ZShkZWZpbml0aW9uOiBNb2R1bGVEZWZpbml0aW9uPFdvcmtzcGFjZXNTZXR0aW5ncz4sIGxvZ2dlckNyZWF0b3I6IExvZ2dlckNyZWF0b3IsIGhlbHBlcnM6IEludGVncmF0aW9uSGVscGVycyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgdGhpcy5fc2V0dGluZ3MgPSBkZWZpbml0aW9uLmRhdGE7XHJcbiAgICB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMgPSBoZWxwZXJzO1xyXG4gICAgdGhpcy5fbG9nZ2VyID0gbG9nZ2VyQ3JlYXRvcignV29ya3NwYWNlc1Byb3ZpZGVyJyk7XHJcblxyXG4gICAgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLnN1YnNjcmliZUxpZmVjeWNsZUV2ZW50KCd3b3Jrc3BhY2UtY2hhbmdlZCcsIGFzeW5jIChwbGF0Zm9ybTogV29ya3NwYWNlUGxhdGZvcm1Nb2R1bGUsIHBheWxvYWQ6IFdvcmtzcGFjZUNoYW5nZWRMaWZlY3ljbGVQYXlsb2FkKSA9PiB7XHJcbiAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gJ2NyZWF0ZScpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2xhc3RRdWVyeS5zdGFydHNXaXRoKCcvdyAnKSkge1xyXG4gICAgICAgICAgYXdhaXQgdGhpcy5yZWJ1aWxkUmVzdWx0cyhwbGF0Zm9ybSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKHBheWxvYWQuYWN0aW9uID09PSAndXBkYXRlJykge1xyXG4gICAgICAgIGNvbnN0IGxhc3RSZXN1bHQgPSB0aGlzLl9sYXN0UmVzdWx0cz8uZmluZCgocmVzKSA9PiByZXMua2V5ID09PSBwYXlsb2FkLmlkKTtcclxuICAgICAgICBpZiAobGFzdFJlc3VsdCkge1xyXG4gICAgICAgICAgbGFzdFJlc3VsdC50aXRsZSA9IHBheWxvYWQud29ya3NwYWNlLnRpdGxlO1xyXG4gICAgICAgICAgbGFzdFJlc3VsdC5kYXRhLndvcmtzcGFjZVRpdGxlID0gcGF5bG9hZC53b3Jrc3BhY2UudGl0bGU7XHJcbiAgICAgICAgICAobGFzdFJlc3VsdC50ZW1wbGF0ZUNvbnRlbnQgYXMgQ3VzdG9tVGVtcGxhdGUpLmRhdGEudGl0bGUgPSBwYXlsb2FkLndvcmtzcGFjZS50aXRsZTtcclxuICAgICAgICAgIHRoaXMucmVzdWx0QWRkVXBkYXRlKFtsYXN0UmVzdWx0XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKHBheWxvYWQuYWN0aW9uID09PSAnZGVsZXRlJykge1xyXG4gICAgICAgIHRoaXMucmVzdWx0UmVtb3ZlKHBheWxvYWQuaWQgYXMgc3RyaW5nKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuc3Vic2NyaWJlTGlmZWN5Y2xlRXZlbnQoJ3RoZW1lLWNoYW5nZWQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBsYXRmb3JtOiBXb3Jrc3BhY2VQbGF0Zm9ybU1vZHVsZSA9IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRQbGF0Zm9ybSgpO1xyXG4gICAgICBhd2FpdCB0aGlzLnJlYnVpbGRSZXN1bHRzKHBsYXRmb3JtKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgbGlzdCBvZiB0aGUgc3RhdGljIGhlbHAgZW50cmllcy5cclxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBoZWxwIGVudHJpZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGFzeW5jIGdldEhlbHBTZWFyY2hFbnRyaWVzKCk6IFByb21pc2U8SG9tZVNlYXJjaFJlc3VsdFtdPiB7XHJcbiAgICBjb25zdCBjb2xvclNjaGVtZSA9IGF3YWl0IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRDdXJyZW50Q29sb3JTY2hlbWVNb2RlKCk7XHJcblxyXG4gICAgcmV0dXJuIFtcclxuICAgICAge1xyXG4gICAgICAgIGtleTogYCR7V29ya3NwYWNlc1Byb3ZpZGVyLl9QUk9WSURFUl9JRH0taGVscDFgLFxyXG4gICAgICAgIHRpdGxlOiAnV29ya3NwYWNlcycsXHJcbiAgICAgICAgbGFiZWw6ICdIZWxwJyxcclxuICAgICAgICBpY29uOiB0aGlzLl9zZXR0aW5ncy5pbWFnZXMud29ya3NwYWNlLnJlcGxhY2UoJ3tzY2hlbWV9JywgY29sb3JTY2hlbWUgYXMgc3RyaW5nKSxcclxuICAgICAgICBhY3Rpb25zOiBbXSxcclxuICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICBwcm92aWRlcklkOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX1BST1ZJREVSX0lELFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGVtcGxhdGU6ICdDdXN0b20nIGFzIENMSVRlbXBsYXRlLkN1c3RvbSxcclxuICAgICAgICB0ZW1wbGF0ZUNvbnRlbnQ6IGF3YWl0IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy50ZW1wbGF0ZUhlbHBlcnMuY3JlYXRlSGVscCgnV29ya3NwYWNlcycsIFsnVXNlIHRoZSB3b3Jrc3BhY2VzIGNvbW1hbmQgdG8gc2F2ZSB5b3VyIGN1cnJlbnQgbGF5b3V0LiddLCBbJy93IHRpdGxlJ10pLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhIGxpc3Qgb2Ygc2VhcmNoIHJlc3VsdHMgYmFzZWQgb24gdGhlIHF1ZXJ5IGFuZCBmaWx0ZXJzLlxyXG4gICAqIEBwYXJhbSBxdWVyeSBUaGUgcXVlcnkgdG8gc2VhcmNoIGZvci5cclxuICAgKiBAcGFyYW0gZmlsdGVycyBUaGUgZmlsdGVycyB0byBhcHBseS5cclxuICAgKiBAcGFyYW0gbGFzdFJlc3BvbnNlIFRoZSBsYXN0IHNlYXJjaCByZXNwb25zZSB1c2VkIGZvciB1cGRhdGluZyBleGlzdGluZyByZXN1bHRzLlxyXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoZSBzZWFyY2ggcXVlcnkuXHJcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgcmVzdWx0cyBhbmQgbmV3IGZpbHRlcnMuXHJcbiAgICovXHJcbiAgcHVibGljIGFzeW5jIGdldFNlYXJjaFJlc3VsdHMoXHJcbiAgICBxdWVyeTogc3RyaW5nLFxyXG4gICAgZmlsdGVyczogQ0xJRmlsdGVyW10sXHJcbiAgICBsYXN0UmVzcG9uc2U6IEhvbWVTZWFyY2hMaXN0ZW5lclJlc3BvbnNlLFxyXG4gICAgb3B0aW9uczoge1xyXG4gICAgICBxdWVyeU1pbkxlbmd0aDogbnVtYmVyO1xyXG4gICAgICBxdWVyeUFnYWluc3Q6IHN0cmluZ1tdO1xyXG4gICAgfSxcclxuICApOiBQcm9taXNlPEhvbWVTZWFyY2hSZXNwb25zZT4ge1xyXG4gICAgY29uc3QgcGxhdGZvcm06IFdvcmtzcGFjZVBsYXRmb3JtTW9kdWxlID0gdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldFBsYXRmb3JtKCk7XHJcbiAgICBjb25zdCB3b3Jrc3BhY2VzOiBXb3Jrc3BhY2VbXSA9IGF3YWl0IHBsYXRmb3JtLlN0b3JhZ2UuZ2V0V29ya3NwYWNlcygpO1xyXG4gICAgY29uc3QgY29sb3JTY2hlbWUgPSBhd2FpdCB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuZ2V0Q3VycmVudENvbG9yU2NoZW1lTW9kZSgpO1xyXG5cclxuICAgIGNvbnN0IHF1ZXJ5TG93ZXIgPSBxdWVyeS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIHRoaXMuX2xhc3RSZXNwb25zZSA9IGxhc3RSZXNwb25zZTtcclxuICAgIHRoaXMuX2xhc3RRdWVyeSA9IHF1ZXJ5TG93ZXI7XHJcbiAgICB0aGlzLl9sYXN0UXVlcnlNaW5MZW5ndGggPSBvcHRpb25zLnF1ZXJ5TWluTGVuZ3RoO1xyXG5cclxuICAgIGlmIChxdWVyeUxvd2VyLnN0YXJ0c1dpdGgoJy93ICcpKSB7XHJcbiAgICAgIGNvbnN0IHRpdGxlID0gcXVlcnlMb3dlci5yZXBsYWNlKCcvdyAnLCAnJyk7XHJcblxyXG4gICAgICBjb25zdCBmb3VuZE1hdGNoID0gd29ya3NwYWNlcy5maW5kKChlbnRyeSkgPT4gZW50cnkudGl0bGUudG9Mb3dlckNhc2UoKSA9PT0gdGl0bGUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIGlmIChmb3VuZE1hdGNoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHJlc3VsdHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGtleTogV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fRVhJU1RTX1dPUktTUEFDRSxcclxuICAgICAgICAgICAgICB0aXRsZTogYFdvcmtzcGFjZSAke2ZvdW5kTWF0Y2gudGl0bGV9IGFscmVhZHkgZXhpc3RzLmAsXHJcbiAgICAgICAgICAgICAgaWNvbjogdGhpcy5fc2V0dGluZ3MuaW1hZ2VzLndvcmtzcGFjZS5yZXBsYWNlKCd7c2NoZW1lfScsIGNvbG9yU2NoZW1lIGFzIHN0cmluZyksXHJcbiAgICAgICAgICAgICAgYWN0aW9uczogW10sXHJcbiAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgcHJvdmlkZXJJZDogV29ya3NwYWNlc1Byb3ZpZGVyLl9QUk9WSURFUl9JRCxcclxuICAgICAgICAgICAgICAgIHRhZ3M6IFsnd29ya3NwYWNlJ10sXHJcbiAgICAgICAgICAgICAgICB3b3Jrc3BhY2VJZDogZm91bmRNYXRjaC53b3Jrc3BhY2VJZCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHRlbXBsYXRlOiBudWxsLFxyXG4gICAgICAgICAgICAgIHRlbXBsYXRlQ29udGVudDogbnVsbCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3VsdHM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAga2V5OiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9TQVZFX1dPUktTUEFDRSxcclxuICAgICAgICAgICAgdGl0bGU6IGBTYXZlIEN1cnJlbnQgV29ya3NwYWNlIGFzICR7dGl0bGV9YCxcclxuICAgICAgICAgICAgaWNvbjogdGhpcy5fc2V0dGluZ3MuaW1hZ2VzLndvcmtzcGFjZS5yZXBsYWNlKCd7c2NoZW1lfScsIGNvbG9yU2NoZW1lIGFzIHN0cmluZyksXHJcbiAgICAgICAgICAgIGxhYmVsOiAnU3VnZ2VzdGlvbicsXHJcbiAgICAgICAgICAgIGFjdGlvbnM6IFt7IG5hbWU6ICdTYXZlIFdvcmtzcGFjZScsIGhvdGtleTogJ0VudGVyJyB9XSxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgIHByb3ZpZGVySWQ6IFdvcmtzcGFjZXNQcm92aWRlci5fUFJPVklERVJfSUQsXHJcbiAgICAgICAgICAgICAgdGFnczogWyd3b3Jrc3BhY2UnXSxcclxuICAgICAgICAgICAgICB3b3Jrc3BhY2VJZDogcmFuZG9tVVVJRCgpLFxyXG4gICAgICAgICAgICAgIHdvcmtzcGFjZVRpdGxlOiB0aXRsZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGVtcGxhdGU6IG51bGwsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlQ29udGVudDogbnVsbCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB3b3Jrc3BhY2VSZXN1bHRzOiBIb21lU2VhcmNoUmVzdWx0W10gPSBhd2FpdCB0aGlzLmJ1aWxkUmVzdWx0cyhwbGF0Zm9ybSwgd29ya3NwYWNlcywgcXVlcnlMb3dlciwgb3B0aW9ucy5xdWVyeU1pbkxlbmd0aCwgY29sb3JTY2hlbWUpO1xyXG5cclxuICAgIHRoaXMuX2xhc3RSZXN1bHRzID0gd29ya3NwYWNlUmVzdWx0cztcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN1bHRzOiB3b3Jrc3BhY2VSZXN1bHRzLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGVudHJ5IGhhcyBiZWVuIHNlbGVjdGVkLlxyXG4gICAqIEBwYXJhbSByZXN1bHQgVGhlIGRpc3BhdGNoZWQgcmVzdWx0LlxyXG4gICAqIEBwYXJhbSBsYXN0UmVzcG9uc2UgVGhlIGxhc3QgcmVzcG9uc2UuXHJcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgaXRlbSB3YXMgaGFuZGxlZC5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgaXRlbVNlbGVjdGlvbihyZXN1bHQ6IEhvbWVEaXNwYXRjaGVkU2VhcmNoUmVzdWx0LCBsYXN0UmVzcG9uc2U6IEhvbWVTZWFyY2hMaXN0ZW5lclJlc3BvbnNlKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xyXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24udHJpZ2dlciA9PT0gJ3VzZXItYWN0aW9uJykge1xyXG4gICAgICBjb25zdCBkYXRhOiB7XHJcbiAgICAgICAgd29ya3NwYWNlSWQ/OiBzdHJpbmc7XHJcbiAgICAgICAgd29ya3NwYWNlVGl0bGU/OiBzdHJpbmc7XHJcbiAgICAgIH0gPSByZXN1bHQuZGF0YTtcclxuXHJcbiAgICAgIGlmIChkYXRhPy53b3Jrc3BhY2VJZCkge1xyXG4gICAgICAgIGhhbmRsZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAocmVzdWx0LmtleSA9PT0gV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fU0FWRV9XT1JLU1BBQ0UpIHtcclxuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc2F2ZSB3b3Jrc3BhY2UgZW50cnlcclxuICAgICAgICAgIHRoaXMucmVzdWx0UmVtb3ZlKHJlc3VsdC5rZXkpO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHBsYXRmb3JtOiBXb3Jrc3BhY2VQbGF0Zm9ybU1vZHVsZSA9IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRQbGF0Zm9ybSgpO1xyXG4gICAgICAgICAgY29uc3Qgc25hcHNob3QgPSBhd2FpdCBwbGF0Zm9ybS5nZXRTbmFwc2hvdCgpO1xyXG4gICAgICAgICAgY29uc3QgY3VycmVudFdvcmtzcGFjZSA9IGF3YWl0IHBsYXRmb3JtLmdldEN1cnJlbnRXb3Jrc3BhY2UoKTtcclxuICAgICAgICAgIGNvbnN0IGN1cnJlbnRNZXRhRGF0YSA9IGN1cnJlbnRXb3Jrc3BhY2U/Lm1ldGFkYXRhO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHdvcmtzcGFjZSA9IHtcclxuICAgICAgICAgICAgd29ya3NwYWNlSWQ6IGRhdGEud29ya3NwYWNlSWQsXHJcbiAgICAgICAgICAgIHRpdGxlOiBkYXRhLndvcmtzcGFjZVRpdGxlLFxyXG4gICAgICAgICAgICBtZXRhZGF0YTogY3VycmVudE1ldGFEYXRhLFxyXG4gICAgICAgICAgICBzbmFwc2hvdCxcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgYXdhaXQgcGxhdGZvcm0uU3RvcmFnZS5zYXZlV29ya3NwYWNlKHdvcmtzcGFjZSk7XHJcblxyXG4gICAgICAgICAgY29uc3Qgc2hhcmVFbmFibGVkOiBib29sZWFuID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmNvbmRpdGlvbignc2hhcmluZycpO1xyXG4gICAgICAgICAgY29uc3QgcGFsZXR0ZTogQ3VzdG9tUGFsZXR0ZVNldCA9IGF3YWl0IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRDdXJyZW50UGFsZXR0ZSgpO1xyXG4gICAgICAgICAgY29uc3QgY29sb3JTY2hlbWUgPSBhd2FpdCB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuZ2V0Q3VycmVudENvbG9yU2NoZW1lTW9kZSgpO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHNhdmVkV29ya3NwYWNlID0gdGhpcy5nZXRXb3Jrc3BhY2VUZW1wbGF0ZSh3b3Jrc3BhY2Uud29ya3NwYWNlSWQsIHdvcmtzcGFjZS50aXRsZSwgc2hhcmVFbmFibGVkLCB0cnVlLCBjb2xvclNjaGVtZSwgcGFsZXR0ZSk7XHJcblxyXG4gICAgICAgICAgLy8gQW5kIGFkZCB0aGUgbmV3IG9uZVxyXG4gICAgICAgICAgdGhpcy5yZXN1bHRBZGRVcGRhdGUoW3NhdmVkV29ya3NwYWNlXSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQua2V5ID09PSBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9FWElTVFNfV09SS1NQQUNFKSB7XHJcbiAgICAgICAgICAvLyBEbyBub3RoaW5nLCB0aGUgdXNlciBtdXN0IHVwZGF0ZSB0aGUgcXVlcnkgdG8gZ2l2ZSBpdCBhIGRpZmZlcmVudFxyXG4gICAgICAgICAgLy8gbmFtZSB3aGljaCB3aWxsIGF1dG9tYXRpY2FsbHkgcmVmcmVzaCB0aGUgcmVzdWx0c1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbi5uYW1lID09PSBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9PUEVOX1dPUktTUEFDRSkge1xyXG4gICAgICAgICAgY29uc3QgcGxhdGZvcm06IFdvcmtzcGFjZVBsYXRmb3JtTW9kdWxlID0gdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldFBsYXRmb3JtKCk7XHJcbiAgICAgICAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBwbGF0Zm9ybS5TdG9yYWdlLmdldFdvcmtzcGFjZShkYXRhLndvcmtzcGFjZUlkKTtcclxuICAgICAgICAgIGF3YWl0IHBsYXRmb3JtLmFwcGx5V29ya3NwYWNlKHdvcmtzcGFjZSk7XHJcbiAgICAgICAgICAvLyBXZSByZWJ1aWxkIHRoZSByZXN1bHRzIGhlcmUgYXMgd2Ugd2lsbCBub3cgaGF2ZSBhIG5ldyBjdXJyZW50IHdvcmtzcGFjZVxyXG4gICAgICAgICAgLy8gYW5kIHdlIG5lZWQgdG8gY2hhbmdlIHRoZSBleGlzdGluZyBvbmUgYmFjayB0byBhIHN0YW5kYXJkIHRlbXBsYXRlXHJcbiAgICAgICAgICBhd2FpdCB0aGlzLnJlYnVpbGRSZXN1bHRzKHBsYXRmb3JtKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5hY3Rpb24ubmFtZSA9PT0gV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fREVMRVRFX1dPUktTUEFDRSkge1xyXG4gICAgICAgICAgY29uc3QgcGxhdGZvcm0gPSB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuZ2V0UGxhdGZvcm0oKTtcclxuICAgICAgICAgIGF3YWl0IHBsYXRmb3JtLlN0b3JhZ2UuZGVsZXRlV29ya3NwYWNlKGRhdGEud29ya3NwYWNlSWQpO1xyXG4gICAgICAgICAgLy8gRGVsZXRpbmcgdGhlIHdvcmtpbmcgd2lsbCBldmVudHVhbGx5IHRyaWdnZXIgdGhlIFwiZGVsZXRlXCIgbGlmZWN5Y2xlXHJcbiAgICAgICAgICAvLyBldmVudCB3aGljaCB3aWxsIHJlbW92ZSBpdCBmcm9tIHRoZSByZXN1bHQgbGlzdFxyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbi5uYW1lID09PSBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9TSEFSRV9XT1JLU1BBQ0UpIHtcclxuICAgICAgICAgIGF3YWl0IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5zaGFyZSh7IHdvcmtzcGFjZUlkOiBkYXRhLndvcmtzcGFjZUlkIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBoYW5kbGVkID0gZmFsc2U7XHJcbiAgICAgICAgICB0aGlzLl9sb2dnZXIud2FybihgVW5yZWNvZ25pemVkIGFjdGlvbiBmb3Igd29ya3NwYWNlIHNlbGVjdGlvbjogJHtkYXRhLndvcmtzcGFjZUlkfWApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBoYW5kbGVkO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRXb3Jrc3BhY2VUZW1wbGF0ZShpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBzaGFyZUVuYWJsZWQ6IGJvb2xlYW4sIGlzQ3VycmVudDogYm9vbGVhbiwgY29sb3JTY2hlbWU6IENvbG9yU2NoZW1lTW9kZSwgcGFsZXR0ZTogQ3VzdG9tUGFsZXR0ZVNldCk6IEhvbWVTZWFyY2hSZXN1bHQge1xyXG4gICAgbGV0IGFjdGlvbnMgPSBbXTtcclxuICAgIGxldCBsYXlvdXQ7XHJcbiAgICBsZXQgZGF0YTtcclxuXHJcbiAgICBpZiAoaXNDdXJyZW50KSB7XHJcbiAgICAgIGxheW91dCA9IHRoaXMuZ2V0T3RoZXJXb3Jrc3BhY2VUZW1wbGF0ZShzaGFyZUVuYWJsZWQsIGZhbHNlLCBwYWxldHRlKTtcclxuICAgICAgZGF0YSA9IHtcclxuICAgICAgICB0aXRsZSxcclxuICAgICAgICBpbnN0cnVjdGlvbnM6ICdUaGlzIGlzIHRoZSBjdXJyZW50bHkgYWN0aXZlIHdvcmtzcGFjZS4gWW91IGNhbiB1c2UgdGhlIEJyb3dzZXIgbWVudSB0byB1cGRhdGUvcmVuYW1lIHRoaXMgd29ya3NwYWNlJyxcclxuICAgICAgICBvcGVuVGV4dDogJ09wZW4nLFxyXG4gICAgICAgIHNoYXJlVGV4dDogJ1NoYXJlJyxcclxuICAgICAgfTtcclxuICAgICAgaWYgKHNoYXJlRW5hYmxlZCkge1xyXG4gICAgICAgIGFjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgICBuYW1lOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9TSEFSRV9XT1JLU1BBQ0UsXHJcbiAgICAgICAgICBob3RrZXk6ICdDbWRPckN0cmwrU2hpZnQrUycsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBuYW1lOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX0FDVElPTl9PUEVOX1dPUktTUEFDRSxcclxuICAgICAgICAgIGhvdGtleTogJ0VudGVyJyxcclxuICAgICAgICB9LFxyXG4gICAgICBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChzaGFyZUVuYWJsZWQpIHtcclxuICAgICAgICBhY3Rpb25zLnB1c2goe1xyXG4gICAgICAgICAgbmFtZTogV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fU0hBUkVfV09SS1NQQUNFLFxyXG4gICAgICAgICAgaG90a2V5OiAnQ21kT3JDdHJsK1NoaWZ0K1MnLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGFjdGlvbnMgPSBhY3Rpb25zLmNvbmNhdChbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbmFtZTogV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fREVMRVRFX1dPUktTUEFDRSxcclxuICAgICAgICAgIGhvdGtleTogJ0NtZE9yQ3RybCtTaGlmdCtEJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIG5hbWU6IFdvcmtzcGFjZXNQcm92aWRlci5fQUNUSU9OX09QRU5fV09SS1NQQUNFLFxyXG4gICAgICAgICAgaG90a2V5OiAnRW50ZXInLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0pO1xyXG4gICAgICBsYXlvdXQgPSB0aGlzLmdldE90aGVyV29ya3NwYWNlVGVtcGxhdGUoc2hhcmVFbmFibGVkLCB0cnVlLCBwYWxldHRlKTtcclxuICAgICAgZGF0YSA9IHtcclxuICAgICAgICB0aXRsZSxcclxuICAgICAgICBpbnN0cnVjdGlvbnM6ICdVc2UgdGhlIGJ1dHRvbnMgYmVsb3cgdG8gaW50ZXJhY3Qgd2l0aCB5b3VyIHNhdmVkIHdvcmtzcGFjZScsXHJcbiAgICAgICAgb3BlblRleHQ6ICdPcGVuJyxcclxuICAgICAgICBkZWxldGVUZXh0OiAnRGVsZXRlJyxcclxuICAgICAgICBzaGFyZVRleHQ6ICdTaGFyZScsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAga2V5OiBpZCxcclxuICAgICAgdGl0bGUsXHJcbiAgICAgIGxhYmVsOiAnV29ya3NwYWNlJyxcclxuICAgICAgaWNvbjogdGhpcy5fc2V0dGluZ3MuaW1hZ2VzLndvcmtzcGFjZS5yZXBsYWNlKCd7c2NoZW1lfScsIGNvbG9yU2NoZW1lIGFzIHN0cmluZyksXHJcbiAgICAgIGFjdGlvbnMsXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICBwcm92aWRlcklkOiBXb3Jrc3BhY2VzUHJvdmlkZXIuX1BST1ZJREVSX0lELFxyXG4gICAgICAgIHdvcmtzcGFjZVRpdGxlOiB0aXRsZSxcclxuICAgICAgICB3b3Jrc3BhY2VJZDogaWQsXHJcbiAgICAgICAgdGFnczogWyd3b3Jrc3BhY2UnXSxcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGU6ICdDdXN0b20nIGFzIENMSVRlbXBsYXRlLkN1c3RvbSxcclxuICAgICAgdGVtcGxhdGVDb250ZW50OiB7XHJcbiAgICAgICAgbGF5b3V0LFxyXG4gICAgICAgIGRhdGEsXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRPdGhlcldvcmtzcGFjZVRlbXBsYXRlKGVuYWJsZVNoYXJlOiBib29sZWFuLCBlbmFibGVEZWxldGU6IGJvb2xlYW4sIHBhbGV0dGU6IEN1c3RvbVBhbGV0dGVTZXQpOiBUZW1wbGF0ZUZyYWdtZW50IHtcclxuICAgIGNvbnN0IGFjdGlvbkJ1dHRvbnM6IFRlbXBsYXRlRnJhZ21lbnRbXSA9IFtcclxuICAgICAge1xyXG4gICAgICAgIHR5cGU6ICdCdXR0b24nLFxyXG4gICAgICAgIGFjdGlvbjogV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fT1BFTl9XT1JLU1BBQ0UsXHJcbiAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ1RleHQnLFxyXG4gICAgICAgICAgICBkYXRhS2V5OiAnb3BlblRleHQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAoZW5hYmxlRGVsZXRlKSB7XHJcbiAgICAgIGFjdGlvbkJ1dHRvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ0J1dHRvbicsXHJcbiAgICAgICAgYnV0dG9uU3R5bGU6ICdwcmltYXJ5JyBhcyBCdXR0b25TdHlsZS5QcmltYXJ5LFxyXG4gICAgICAgIGFjdGlvbjogV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fREVMRVRFX1dPUktTUEFDRSxcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnVGV4dCcsXHJcbiAgICAgICAgICAgIGRhdGFLZXk6ICdkZWxldGVUZXh0JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGVuYWJsZVNoYXJlKSB7XHJcbiAgICAgIGFjdGlvbkJ1dHRvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ0J1dHRvbicsXHJcbiAgICAgICAgYnV0dG9uU3R5bGU6ICdwcmltYXJ5JyBhcyBCdXR0b25TdHlsZS5QcmltYXJ5LFxyXG4gICAgICAgIGFjdGlvbjogV29ya3NwYWNlc1Byb3ZpZGVyLl9BQ1RJT05fU0hBUkVfV09SS1NQQUNFLFxyXG4gICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdUZXh0JyxcclxuICAgICAgICAgICAgZGF0YUtleTogJ3NoYXJlVGV4dCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdDb250YWluZXInLFxyXG4gICAgICBzdHlsZToge1xyXG4gICAgICAgIHBhZGRpbmc6ICcxMHB4JyxcclxuICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsXHJcbiAgICAgICAgZmxleDogMSxcclxuICAgICAgfSxcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0eXBlOiAnVGV4dCcsXHJcbiAgICAgICAgICBkYXRhS2V5OiAndGl0bGUnLFxyXG4gICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgZm9udFdlaWdodDogJ2JvbGQnLFxyXG4gICAgICAgICAgICBmb250U2l6ZTogJzE2cHgnLFxyXG4gICAgICAgICAgICBwYWRkaW5nQm90dG9tOiAnNXB4JyxcclxuICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnMTBweCcsXHJcbiAgICAgICAgICAgIGJvcmRlckJvdHRvbTogYDFweCBzb2xpZCAke3BhbGV0dGUuYmFja2dyb3VuZDZ9YCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0eXBlOiAnVGV4dCcsXHJcbiAgICAgICAgICBkYXRhS2V5OiAnaW5zdHJ1Y3Rpb25zJyxcclxuICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIGZsZXg6IDEsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdHlwZTogJ0NvbnRhaW5lcicsXHJcbiAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcclxuICAgICAgICAgICAgZ2FwOiAnMTBweCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgY2hpbGRyZW46IGFjdGlvbkJ1dHRvbnMsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIHJlYnVpbGRSZXN1bHRzKHBsYXRmb3JtOiBXb3Jrc3BhY2VQbGF0Zm9ybU1vZHVsZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgY29sb3JTY2hlbWUgPSBhd2FpdCB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuZ2V0Q3VycmVudENvbG9yU2NoZW1lTW9kZSgpO1xyXG5cclxuICAgIGNvbnN0IHdvcmtzcGFjZXM6IFdvcmtzcGFjZVtdID0gYXdhaXQgcGxhdGZvcm0uU3RvcmFnZS5nZXRXb3Jrc3BhY2VzKCk7XHJcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5idWlsZFJlc3VsdHMocGxhdGZvcm0sIHdvcmtzcGFjZXMsIHRoaXMuX2xhc3RRdWVyeSwgdGhpcy5fbGFzdFF1ZXJ5TWluTGVuZ3RoLCBjb2xvclNjaGVtZSk7XHJcbiAgICB0aGlzLnJlc3VsdEFkZFVwZGF0ZShyZXN1bHRzKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgYnVpbGRSZXN1bHRzKFxyXG4gICAgcGxhdGZvcm06IFdvcmtzcGFjZVBsYXRmb3JtTW9kdWxlLFxyXG4gICAgd29ya3NwYWNlczogV29ya3NwYWNlW10sXHJcbiAgICBxdWVyeTogc3RyaW5nLFxyXG4gICAgcXVlcnlNaW5MZW5ndGg6IG51bWJlcixcclxuICAgIGNvbG9yU2NoZW1lOiBDb2xvclNjaGVtZU1vZGUsXHJcbiAgKTogUHJvbWlzZTxIb21lU2VhcmNoUmVzdWx0W10+IHtcclxuICAgIGxldCByZXN1bHRzOiBIb21lU2VhcmNoUmVzdWx0W10gPSBbXTtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh3b3Jrc3BhY2VzKSkge1xyXG4gICAgICBjb25zdCBjdXJyZW50V29ya3NwYWNlID0gYXdhaXQgcGxhdGZvcm0uZ2V0Q3VycmVudFdvcmtzcGFjZSgpO1xyXG4gICAgICBjb25zdCBjdXJyZW50V29ya3NwYWNlSWQgPSBjdXJyZW50V29ya3NwYWNlPy53b3Jrc3BhY2VJZDtcclxuICAgICAgY29uc3Qgc2hhcmVFbmFibGVkOiBib29sZWFuID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmNvbmRpdGlvbignc2hhcmluZycpO1xyXG4gICAgICBjb25zdCBwYWxldHRlOiBDdXN0b21QYWxldHRlU2V0ID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldEN1cnJlbnRQYWxldHRlKCk7XHJcblxyXG4gICAgICByZXN1bHRzID0gd29ya3NwYWNlc1xyXG4gICAgICAgIC5maWx0ZXIoKHBnKSA9PiBxdWVyeS5sZW5ndGggPT09IDAgfHwgKHF1ZXJ5Lmxlbmd0aCA+PSBxdWVyeU1pbkxlbmd0aCAmJiBwZy50aXRsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KSkpXHJcbiAgICAgICAgLm1hcCgod3M6IFdvcmtzcGFjZSwgaW5kZXg6IG51bWJlcikgPT4gdGhpcy5nZXRXb3Jrc3BhY2VUZW1wbGF0ZSh3cy53b3Jrc3BhY2VJZCwgd3MudGl0bGUsIHNoYXJlRW5hYmxlZCwgY3VycmVudFdvcmtzcGFjZUlkID09PSB3cy53b3Jrc3BhY2VJZCwgY29sb3JTY2hlbWUsIHBhbGV0dGUpKVxyXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnRpdGxlLmxvY2FsZUNvbXBhcmUoYi50aXRsZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlc3VsdEFkZFVwZGF0ZShyZXN1bHRzOiBIb21lU2VhcmNoUmVzdWx0W10pOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLl9sYXN0UmVzdWx0cykge1xyXG4gICAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0SW5kZXggPSB0aGlzLl9sYXN0UmVzdWx0cy5maW5kSW5kZXgoKHJlcykgPT4gcmVzLmtleSA9PT0gcmVzdWx0LmtleSk7XHJcbiAgICAgICAgaWYgKHJlc3VsdEluZGV4ID49IDApIHtcclxuICAgICAgICAgIHRoaXMuX2xhc3RSZXN1bHRzLnNwbGljZShyZXN1bHRJbmRleCwgMSwgcmVzdWx0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5fbGFzdFJlc3VsdHMucHVzaChyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX2xhc3RSZXNwb25zZSkge1xyXG4gICAgICB0aGlzLl9sYXN0UmVzcG9uc2UucmVzcG9uZChyZXN1bHRzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVzdWx0UmVtb3ZlKGlkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLl9sYXN0UmVzdWx0cykge1xyXG4gICAgICBjb25zdCByZXN1bHRJbmRleCA9IHRoaXMuX2xhc3RSZXN1bHRzLmZpbmRJbmRleCgocmVzKSA9PiByZXMua2V5ID09PSBpZCk7XHJcbiAgICAgIGlmIChyZXN1bHRJbmRleCA+PSAwKSB7XHJcbiAgICAgICAgdGhpcy5fbGFzdFJlc3VsdHMuc3BsaWNlKHJlc3VsdEluZGV4LCAxKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX2xhc3RSZXNwb25zZSkge1xyXG4gICAgICB0aGlzLl9sYXN0UmVzcG9uc2UucmV2b2tlKGlkKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBXb3Jrc3BhY2VzUHJvdmlkZXIgfSBmcm9tIFwiLi9pbnRlZ3JhdGlvblwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IGVudHJ5UG9pbnRzOiB7IFtpZDogc3RyaW5nXTogV29ya3NwYWNlc1Byb3ZpZGVyIH0gPSB7XHJcblx0aW50ZWdyYXRpb25zOiBuZXcgV29ya3NwYWNlc1Byb3ZpZGVyKClcclxufTtcclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9