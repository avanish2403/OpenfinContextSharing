/******/ var __webpack_modules__ = ({

/***/ "./client/src/modules/integrations/pages/integration.ts":
/*!**************************************************************!*\
  !*** ./client/src/modules/integrations/pages/integration.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PagesProvider": () => (/* binding */ PagesProvider)
/* harmony export */ });
/**
 * Implement the integration provider for pages.
 */
class PagesProvider {
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
        this._logger = loggerCreator('PagesProvider');
        this._integrationHelpers.subscribeLifecycleEvent('page-changed', async (platform, payload) => {
            if (payload.action === 'create') {
                await this.rebuildResults(platform);
            }
            else if (payload.action === 'update') {
                const lastResult = this._lastResults?.find((res) => res.key === payload.id);
                if (lastResult) {
                    lastResult.title = payload.page.title;
                    lastResult.data.workspaceTitle = payload.page.title;
                    lastResult.templateContent.data.title = payload.page.title;
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
        return [];
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
        const pages = await platform.Storage.getPages();
        const colorScheme = await this._integrationHelpers.getCurrentColorSchemeMode();
        const queryLower = query.toLowerCase();
        this._lastResponse = lastResponse;
        this._lastQuery = queryLower;
        this._lastQueryMinLength = options.queryMinLength;
        const pageResults = await this.buildResults(platform, pages, queryLower, options.queryMinLength, colorScheme);
        this._lastResults = pageResults;
        return {
            results: pageResults,
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
            if (data?.pageId) {
                handled = true;
                if (result.action.name === PagesProvider._ACTION_LAUNCH_PAGE) {
                    const platform = this._integrationHelpers.getPlatform();
                    const pageToLaunch = await platform.Storage.getPage(data.pageId);
                    await this._integrationHelpers.launchPage(pageToLaunch);
                }
                else if (result.action.name === PagesProvider._ACTION_DELETE_PAGE) {
                    const platform = this._integrationHelpers.getPlatform();
                    await platform.Storage.deletePage(data.pageId);
                    // Deleting the page will eventually trigger the "delete" lifecycle
                    // event which will remove it from the result list
                }
                else if (result.action.name === PagesProvider._ACTION_SHARE_PAGE) {
                    await this._integrationHelpers.share({ pageId: data.pageId });
                }
                else {
                    handled = false;
                    this._logger.warn(`Unrecognized action for page selection: ${data.pageId}`);
                }
            }
        }
        return handled;
    }
    getPageTemplate(id, title, shareEnabled, colorScheme, palette) {
        let actions = [];
        if (shareEnabled) {
            actions.push({
                name: PagesProvider._ACTION_SHARE_PAGE,
                hotkey: 'CmdOrCtrl+Shift+S',
            });
        }
        actions = actions.concat([
            {
                name: PagesProvider._ACTION_DELETE_PAGE,
                hotkey: 'CmdOrCtrl+Shift+D',
            },
            {
                name: PagesProvider._ACTION_LAUNCH_PAGE,
                hotkey: 'Enter',
            },
        ]);
        const layout = this.getOtherPageTemplate(shareEnabled, palette);
        return {
            key: id,
            title,
            label: 'Page',
            icon: this._settings.images.page.replace('{scheme}', colorScheme),
            actions,
            data: {
                providerId: PagesProvider._PROVIDER_ID,
                pageTitle: title,
                pageId: id,
                tags: ['page'],
            },
            template: 'Custom',
            templateContent: {
                layout,
                data: {
                    title,
                    instructions: 'Use the buttons below to interact with your saved page',
                    openText: 'Launch',
                    deleteText: 'Delete',
                    shareText: 'Share',
                },
            },
        };
    }
    getOtherPageTemplate(enableShare, palette) {
        const actionButtons = [
            {
                type: 'Button',
                action: PagesProvider._ACTION_LAUNCH_PAGE,
                children: [
                    {
                        type: 'Text',
                        dataKey: 'openText',
                    },
                ],
            },
            {
                type: 'Button',
                buttonStyle: 'primary',
                action: PagesProvider._ACTION_DELETE_PAGE,
                children: [
                    {
                        type: 'Text',
                        dataKey: 'deleteText',
                    },
                ],
            },
        ];
        if (enableShare) {
            actionButtons.push({
                type: 'Button',
                buttonStyle: 'primary',
                action: PagesProvider._ACTION_SHARE_PAGE,
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
        const pages = await platform.Storage.getPages();
        const results = await this.buildResults(platform, pages, this._lastQuery, this._lastQueryMinLength, colorScheme);
        this.resultAddUpdate(results);
    }
    async buildResults(platform, pages, query, queryMinLength, colorScheme) {
        let results = [];
        if (Array.isArray(pages)) {
            const shareEnabled = await this._integrationHelpers.condition('sharing');
            const palette = await this._integrationHelpers.getCurrentPalette();
            results = pages
                .filter((pg) => query.length === 0 || (query.length >= queryMinLength && pg.title.toLowerCase().includes(query)))
                .map((pg) => this.getPageTemplate(pg.pageId, pg.title, shareEnabled, colorScheme, palette))
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
PagesProvider._PROVIDER_ID = 'pages';
/**
 * The key to use for launching a page.
 * @internal
 */
PagesProvider._ACTION_LAUNCH_PAGE = 'Launch Page';
/**
 * The key to use for deleting a page.
 * @internal
 */
PagesProvider._ACTION_DELETE_PAGE = 'Delete Page';
/**
 * The key to use for sharing a page.
 * @internal
 */
PagesProvider._ACTION_SHARE_PAGE = 'Share Page';


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
/*!********************************************************!*\
  !*** ./client/src/modules/integrations/pages/index.ts ***!
  \********************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "entryPoints": () => (/* binding */ entryPoints)
/* harmony export */ });
/* harmony import */ var _integration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./integration */ "./client/src/modules/integrations/pages/integration.ts");

const entryPoints = {
    integrations: new _integration__WEBPACK_IMPORTED_MODULE_0__.PagesProvider()
};

})();

var __webpack_exports__entryPoints = __webpack_exports__.entryPoints;
export { __webpack_exports__entryPoints as entryPoints };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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R0FHRztBQUNxQixpQ0FBbUIsR0FBRyxhQUFhLENBQUM7QUFFNUQ7OztHQUdHO0FBQ3FCLGdDQUFrQixHQUFHLFlBQVksQ0FBQzs7Ozs7OztTQy9DNUQ7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTs7U0FFQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTs7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0E7VUFDQSx5Q0FBeUMsd0NBQXdDO1VBQ2pGO1VBQ0E7VUFDQTs7Ozs7VUNQQTs7Ozs7VUNBQTtVQUNBO1VBQ0E7VUFDQSx1REFBdUQsaUJBQWlCO1VBQ3hFO1VBQ0EsZ0RBQWdELGFBQWE7VUFDN0Q7Ozs7Ozs7Ozs7Ozs7OztBQ044QztBQUV2QyxNQUFNLFdBQVcsR0FBb0M7SUFDM0QsWUFBWSxFQUFFLElBQUksdURBQWEsRUFBRTtDQUNqQyxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbmlydmFuYW9wZW5maW4td29ya3NwYWNlLy4vY2xpZW50L3NyYy9tb2R1bGVzL2ludGVncmF0aW9ucy9wYWdlcy9pbnRlZ3JhdGlvbi50cyIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbmlydmFuYW9wZW5maW4td29ya3NwYWNlL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2UvLi9jbGllbnQvc3JjL21vZHVsZXMvaW50ZWdyYXRpb25zL3BhZ2VzL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcclxuICBCdXR0b25TdHlsZSxcclxuICBDTElGaWx0ZXIsXHJcbiAgQ0xJVGVtcGxhdGUsXHJcbiAgQ3VzdG9tVGVtcGxhdGUsXHJcbiAgSG9tZURpc3BhdGNoZWRTZWFyY2hSZXN1bHQsXHJcbiAgSG9tZVNlYXJjaExpc3RlbmVyUmVzcG9uc2UsXHJcbiAgSG9tZVNlYXJjaFJlc3BvbnNlLFxyXG4gIEhvbWVTZWFyY2hSZXN1bHQsXHJcbiAgUGFnZSxcclxuICBUZW1wbGF0ZUZyYWdtZW50LFxyXG59IGZyb20gJ0BvcGVuZmluL3dvcmtzcGFjZSc7XHJcbmltcG9ydCB0eXBlIHsgV29ya3NwYWNlUGxhdGZvcm1Nb2R1bGUgfSBmcm9tICdAb3BlbmZpbi93b3Jrc3BhY2UtcGxhdGZvcm0nO1xyXG5pbXBvcnQgdHlwZSB7IEN1c3RvbVBhbGV0dGVTZXQgfSBmcm9tICdAb3BlbmZpbi93b3Jrc3BhY2UvY2xpZW50LWFwaS1wbGF0Zm9ybS9zcmMvc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBQYWdlQ2hhbmdlZExpZmVjeWNsZVBheWxvYWQgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgSW50ZWdyYXRpb25IZWxwZXJzLCBJbnRlZ3JhdGlvbk1vZHVsZSB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL2ludGVncmF0aW9ucy1zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IExvZ2dlciwgTG9nZ2VyQ3JlYXRvciB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL2xvZ2dlci1zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IE1vZHVsZURlZmluaXRpb24gfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy9tb2R1bGUtc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBDb2xvclNjaGVtZU1vZGUgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy90aGVtZS1zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IFBhZ2VzU2V0dGluZ3MgfSBmcm9tICcuL3NoYXBlcyc7XHJcblxyXG4vKipcclxuICogSW1wbGVtZW50IHRoZSBpbnRlZ3JhdGlvbiBwcm92aWRlciBmb3IgcGFnZXMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgUGFnZXNQcm92aWRlciBpbXBsZW1lbnRzIEludGVncmF0aW9uTW9kdWxlPFBhZ2VzU2V0dGluZ3M+IHtcclxuICAvKipcclxuICAgKiBQcm92aWRlciBpZC5cclxuICAgKiBAaW50ZXJuYWxcclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfUFJPVklERVJfSUQgPSAncGFnZXMnO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUga2V5IHRvIHVzZSBmb3IgbGF1bmNoaW5nIGEgcGFnZS5cclxuICAgKiBAaW50ZXJuYWxcclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfQUNUSU9OX0xBVU5DSF9QQUdFID0gJ0xhdW5jaCBQYWdlJztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGtleSB0byB1c2UgZm9yIGRlbGV0aW5nIGEgcGFnZS5cclxuICAgKiBAaW50ZXJuYWxcclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfQUNUSU9OX0RFTEVURV9QQUdFID0gJ0RlbGV0ZSBQYWdlJztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGtleSB0byB1c2UgZm9yIHNoYXJpbmcgYSBwYWdlLlxyXG4gICAqIEBpbnRlcm5hbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9BQ1RJT05fU0hBUkVfUEFHRSA9ICdTaGFyZSBQYWdlJztcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHNldHRpbmdzIGZyb20gY29uZmlnLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX3NldHRpbmdzOiBQYWdlc1NldHRpbmdzO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgc2V0dGluZ3MgZm9yIHRoZSBpbnRlZ3JhdGlvbi5cclxuICAgKiBAaW50ZXJuYWxcclxuICAgKi9cclxuICBwcml2YXRlIF9sb2dnZXI6IExvZ2dlcjtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGludGVncmF0aW9uIGhlbHBlcnMuXHJcbiAgICogQGludGVybmFsXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfaW50ZWdyYXRpb25IZWxwZXJzOiBJbnRlZ3JhdGlvbkhlbHBlcnMgfCB1bmRlZmluZWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBsYXN0IHNlYXJjaCByZXNwb25zZS5cclxuICAgKi9cclxuICBwcml2YXRlIF9sYXN0UmVzcG9uc2U/OiBIb21lU2VhcmNoTGlzdGVuZXJSZXNwb25zZTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGxhc3QgcXVlcnkuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfbGFzdFF1ZXJ5Pzogc3RyaW5nO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgbGFzdCBxdWVyeSBtaW4gbGVuZ3RoLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2xhc3RRdWVyeU1pbkxlbmd0aD86IG51bWJlcjtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGxhc3QgcmVzdWx0cy5cclxuICAgKi9cclxuICBwcml2YXRlIF9sYXN0UmVzdWx0cz86IEhvbWVTZWFyY2hSZXN1bHRbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZSB0aGUgbW9kdWxlLlxyXG4gICAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBtb2R1bGUgZnJvbSBjb25maWd1cmF0aW9uIGluY2x1ZGUgY3VzdG9tIG9wdGlvbnMuXHJcbiAgICogQHBhcmFtIGxvZ2dlckNyZWF0b3IgRm9yIGxvZ2dpbmcgZW50cmllcy5cclxuICAgKiBAcGFyYW0gaGVscGVycyBIZWxwZXIgbWV0aG9kcyBmb3IgdGhlIG1vZHVsZSB0byBpbnRlcmFjdCB3aXRoIHRoZSBhcHBsaWNhdGlvbiBjb3JlLlxyXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIGFzeW5jIGluaXRpYWxpemUoZGVmaW5pdGlvbjogTW9kdWxlRGVmaW5pdGlvbjxQYWdlc1NldHRpbmdzPiwgbG9nZ2VyQ3JlYXRvcjogTG9nZ2VyQ3JlYXRvciwgaGVscGVyczogSW50ZWdyYXRpb25IZWxwZXJzKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICB0aGlzLl9zZXR0aW5ncyA9IGRlZmluaXRpb24uZGF0YTtcclxuICAgIHRoaXMuX2ludGVncmF0aW9uSGVscGVycyA9IGhlbHBlcnM7XHJcbiAgICB0aGlzLl9sb2dnZXIgPSBsb2dnZXJDcmVhdG9yKCdQYWdlc1Byb3ZpZGVyJyk7XHJcblxyXG4gICAgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLnN1YnNjcmliZUxpZmVjeWNsZUV2ZW50KCdwYWdlLWNoYW5nZWQnLCBhc3luYyAocGxhdGZvcm06IFdvcmtzcGFjZVBsYXRmb3JtTW9kdWxlLCBwYXlsb2FkOiBQYWdlQ2hhbmdlZExpZmVjeWNsZVBheWxvYWQpID0+IHtcclxuICAgICAgaWYgKHBheWxvYWQuYWN0aW9uID09PSAnY3JlYXRlJykge1xyXG4gICAgICAgIGF3YWl0IHRoaXMucmVidWlsZFJlc3VsdHMocGxhdGZvcm0pO1xyXG4gICAgICB9IGVsc2UgaWYgKHBheWxvYWQuYWN0aW9uID09PSAndXBkYXRlJykge1xyXG4gICAgICAgIGNvbnN0IGxhc3RSZXN1bHQgPSB0aGlzLl9sYXN0UmVzdWx0cz8uZmluZCgocmVzKSA9PiByZXMua2V5ID09PSBwYXlsb2FkLmlkKTtcclxuICAgICAgICBpZiAobGFzdFJlc3VsdCkge1xyXG4gICAgICAgICAgbGFzdFJlc3VsdC50aXRsZSA9IHBheWxvYWQucGFnZS50aXRsZTtcclxuICAgICAgICAgIGxhc3RSZXN1bHQuZGF0YS53b3Jrc3BhY2VUaXRsZSA9IHBheWxvYWQucGFnZS50aXRsZTtcclxuICAgICAgICAgIChsYXN0UmVzdWx0LnRlbXBsYXRlQ29udGVudCBhcyBDdXN0b21UZW1wbGF0ZSkuZGF0YS50aXRsZSA9IHBheWxvYWQucGFnZS50aXRsZTtcclxuICAgICAgICAgIHRoaXMucmVzdWx0QWRkVXBkYXRlKFtsYXN0UmVzdWx0XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKHBheWxvYWQuYWN0aW9uID09PSAnZGVsZXRlJykge1xyXG4gICAgICAgIHRoaXMucmVzdWx0UmVtb3ZlKHBheWxvYWQuaWQgYXMgc3RyaW5nKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuc3Vic2NyaWJlTGlmZWN5Y2xlRXZlbnQoJ3RoZW1lLWNoYW5nZWQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBsYXRmb3JtOiBXb3Jrc3BhY2VQbGF0Zm9ybU1vZHVsZSA9IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRQbGF0Zm9ybSgpO1xyXG4gICAgICBhd2FpdCB0aGlzLnJlYnVpbGRSZXN1bHRzKHBsYXRmb3JtKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgbGlzdCBvZiB0aGUgc3RhdGljIGhlbHAgZW50cmllcy5cclxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBoZWxwIGVudHJpZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGFzeW5jIGdldEhlbHBTZWFyY2hFbnRyaWVzKCk6IFByb21pc2U8SG9tZVNlYXJjaFJlc3VsdFtdPiB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgYSBsaXN0IG9mIHNlYXJjaCByZXN1bHRzIGJhc2VkIG9uIHRoZSBxdWVyeSBhbmQgZmlsdGVycy5cclxuICAgKiBAcGFyYW0gcXVlcnkgVGhlIHF1ZXJ5IHRvIHNlYXJjaCBmb3IuXHJcbiAgICogQHBhcmFtIGZpbHRlcnMgVGhlIGZpbHRlcnMgdG8gYXBwbHkuXHJcbiAgICogQHBhcmFtIGxhc3RSZXNwb25zZSBUaGUgbGFzdCBzZWFyY2ggcmVzcG9uc2UgdXNlZCBmb3IgdXBkYXRpbmcgZXhpc3RpbmcgcmVzdWx0cy5cclxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciB0aGUgc2VhcmNoIHF1ZXJ5LlxyXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHJlc3VsdHMgYW5kIG5ldyBmaWx0ZXJzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBnZXRTZWFyY2hSZXN1bHRzKFxyXG4gICAgcXVlcnk6IHN0cmluZyxcclxuICAgIGZpbHRlcnM6IENMSUZpbHRlcltdLFxyXG4gICAgbGFzdFJlc3BvbnNlOiBIb21lU2VhcmNoTGlzdGVuZXJSZXNwb25zZSxcclxuICAgIG9wdGlvbnM6IHtcclxuICAgICAgcXVlcnlNaW5MZW5ndGg6IG51bWJlcjtcclxuICAgICAgcXVlcnlBZ2FpbnN0OiBzdHJpbmdbXTtcclxuICAgIH0sXHJcbiAgKTogUHJvbWlzZTxIb21lU2VhcmNoUmVzcG9uc2U+IHtcclxuICAgIGNvbnN0IHBsYXRmb3JtOiBXb3Jrc3BhY2VQbGF0Zm9ybU1vZHVsZSA9IHRoaXMuX2ludGVncmF0aW9uSGVscGVycy5nZXRQbGF0Zm9ybSgpO1xyXG4gICAgY29uc3QgcGFnZXM6IFBhZ2VbXSA9IGF3YWl0IHBsYXRmb3JtLlN0b3JhZ2UuZ2V0UGFnZXMoKTtcclxuICAgIGNvbnN0IGNvbG9yU2NoZW1lID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldEN1cnJlbnRDb2xvclNjaGVtZU1vZGUoKTtcclxuICAgIGNvbnN0IHF1ZXJ5TG93ZXIgPSBxdWVyeS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIHRoaXMuX2xhc3RSZXNwb25zZSA9IGxhc3RSZXNwb25zZTtcclxuICAgIHRoaXMuX2xhc3RRdWVyeSA9IHF1ZXJ5TG93ZXI7XHJcbiAgICB0aGlzLl9sYXN0UXVlcnlNaW5MZW5ndGggPSBvcHRpb25zLnF1ZXJ5TWluTGVuZ3RoO1xyXG5cclxuICAgIGNvbnN0IHBhZ2VSZXN1bHRzOiBIb21lU2VhcmNoUmVzdWx0W10gPSBhd2FpdCB0aGlzLmJ1aWxkUmVzdWx0cyhwbGF0Zm9ybSwgcGFnZXMsIHF1ZXJ5TG93ZXIsIG9wdGlvbnMucXVlcnlNaW5MZW5ndGgsIGNvbG9yU2NoZW1lKTtcclxuXHJcbiAgICB0aGlzLl9sYXN0UmVzdWx0cyA9IHBhZ2VSZXN1bHRzO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3VsdHM6IHBhZ2VSZXN1bHRzLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGVudHJ5IGhhcyBiZWVuIHNlbGVjdGVkLlxyXG4gICAqIEBwYXJhbSByZXN1bHQgVGhlIGRpc3BhdGNoZWQgcmVzdWx0LlxyXG4gICAqIEBwYXJhbSBsYXN0UmVzcG9uc2UgVGhlIGxhc3QgcmVzcG9uc2UuXHJcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgaXRlbSB3YXMgaGFuZGxlZC5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgaXRlbVNlbGVjdGlvbihyZXN1bHQ6IEhvbWVEaXNwYXRjaGVkU2VhcmNoUmVzdWx0LCBsYXN0UmVzcG9uc2U6IEhvbWVTZWFyY2hMaXN0ZW5lclJlc3BvbnNlKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xyXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24udHJpZ2dlciA9PT0gJ3VzZXItYWN0aW9uJykge1xyXG4gICAgICBjb25zdCBkYXRhOiB7XHJcbiAgICAgICAgcGFnZUlkPzogc3RyaW5nO1xyXG4gICAgICB9ID0gcmVzdWx0LmRhdGE7XHJcblxyXG4gICAgICBpZiAoZGF0YT8ucGFnZUlkKSB7XHJcbiAgICAgICAgaGFuZGxlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmIChyZXN1bHQuYWN0aW9uLm5hbWUgPT09IFBhZ2VzUHJvdmlkZXIuX0FDVElPTl9MQVVOQ0hfUEFHRSkge1xyXG4gICAgICAgICAgY29uc3QgcGxhdGZvcm0gPSB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMuZ2V0UGxhdGZvcm0oKTtcclxuICAgICAgICAgIGNvbnN0IHBhZ2VUb0xhdW5jaCA9IGF3YWl0IHBsYXRmb3JtLlN0b3JhZ2UuZ2V0UGFnZShkYXRhLnBhZ2VJZCk7XHJcbiAgICAgICAgICBhd2FpdCB0aGlzLl9pbnRlZ3JhdGlvbkhlbHBlcnMubGF1bmNoUGFnZShwYWdlVG9MYXVuY2gpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbi5uYW1lID09PSBQYWdlc1Byb3ZpZGVyLl9BQ1RJT05fREVMRVRFX1BBR0UpIHtcclxuICAgICAgICAgIGNvbnN0IHBsYXRmb3JtID0gdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldFBsYXRmb3JtKCk7XHJcbiAgICAgICAgICBhd2FpdCBwbGF0Zm9ybS5TdG9yYWdlLmRlbGV0ZVBhZ2UoZGF0YS5wYWdlSWQpO1xyXG4gICAgICAgICAgLy8gRGVsZXRpbmcgdGhlIHBhZ2Ugd2lsbCBldmVudHVhbGx5IHRyaWdnZXIgdGhlIFwiZGVsZXRlXCIgbGlmZWN5Y2xlXHJcbiAgICAgICAgICAvLyBldmVudCB3aGljaCB3aWxsIHJlbW92ZSBpdCBmcm9tIHRoZSByZXN1bHQgbGlzdFxyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbi5uYW1lID09PSBQYWdlc1Byb3ZpZGVyLl9BQ1RJT05fU0hBUkVfUEFHRSkge1xyXG4gICAgICAgICAgYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLnNoYXJlKHsgcGFnZUlkOiBkYXRhLnBhZ2VJZCB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaGFuZGxlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgdGhpcy5fbG9nZ2VyLndhcm4oYFVucmVjb2duaXplZCBhY3Rpb24gZm9yIHBhZ2Ugc2VsZWN0aW9uOiAke2RhdGEucGFnZUlkfWApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBoYW5kbGVkO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRQYWdlVGVtcGxhdGUoaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgc2hhcmVFbmFibGVkOiBib29sZWFuLCBjb2xvclNjaGVtZTogQ29sb3JTY2hlbWVNb2RlLCBwYWxldHRlOiBDdXN0b21QYWxldHRlU2V0KTogSG9tZVNlYXJjaFJlc3VsdCB7XHJcbiAgICBsZXQgYWN0aW9ucyA9IFtdO1xyXG5cclxuICAgIGlmIChzaGFyZUVuYWJsZWQpIHtcclxuICAgICAgYWN0aW9ucy5wdXNoKHtcclxuICAgICAgICBuYW1lOiBQYWdlc1Byb3ZpZGVyLl9BQ1RJT05fU0hBUkVfUEFHRSxcclxuICAgICAgICBob3RrZXk6ICdDbWRPckN0cmwrU2hpZnQrUycsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KFtcclxuICAgICAge1xyXG4gICAgICAgIG5hbWU6IFBhZ2VzUHJvdmlkZXIuX0FDVElPTl9ERUxFVEVfUEFHRSxcclxuICAgICAgICBob3RrZXk6ICdDbWRPckN0cmwrU2hpZnQrRCcsXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiBQYWdlc1Byb3ZpZGVyLl9BQ1RJT05fTEFVTkNIX1BBR0UsXHJcbiAgICAgICAgaG90a2V5OiAnRW50ZXInLFxyXG4gICAgICB9LFxyXG4gICAgXSk7XHJcbiAgICBjb25zdCBsYXlvdXQgPSB0aGlzLmdldE90aGVyUGFnZVRlbXBsYXRlKHNoYXJlRW5hYmxlZCwgcGFsZXR0ZSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAga2V5OiBpZCxcclxuICAgICAgdGl0bGUsXHJcbiAgICAgIGxhYmVsOiAnUGFnZScsXHJcbiAgICAgIGljb246IHRoaXMuX3NldHRpbmdzLmltYWdlcy5wYWdlLnJlcGxhY2UoJ3tzY2hlbWV9JywgY29sb3JTY2hlbWUgYXMgc3RyaW5nKSxcclxuICAgICAgYWN0aW9ucyxcclxuICAgICAgZGF0YToge1xyXG4gICAgICAgIHByb3ZpZGVySWQ6IFBhZ2VzUHJvdmlkZXIuX1BST1ZJREVSX0lELFxyXG4gICAgICAgIHBhZ2VUaXRsZTogdGl0bGUsXHJcbiAgICAgICAgcGFnZUlkOiBpZCxcclxuICAgICAgICB0YWdzOiBbJ3BhZ2UnXSxcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGU6ICdDdXN0b20nIGFzIENMSVRlbXBsYXRlLkN1c3RvbSxcclxuICAgICAgdGVtcGxhdGVDb250ZW50OiB7XHJcbiAgICAgICAgbGF5b3V0LFxyXG4gICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgIHRpdGxlLFxyXG4gICAgICAgICAgaW5zdHJ1Y3Rpb25zOiAnVXNlIHRoZSBidXR0b25zIGJlbG93IHRvIGludGVyYWN0IHdpdGggeW91ciBzYXZlZCBwYWdlJyxcclxuICAgICAgICAgIG9wZW5UZXh0OiAnTGF1bmNoJyxcclxuICAgICAgICAgIGRlbGV0ZVRleHQ6ICdEZWxldGUnLFxyXG4gICAgICAgICAgc2hhcmVUZXh0OiAnU2hhcmUnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRPdGhlclBhZ2VUZW1wbGF0ZShlbmFibGVTaGFyZTogYm9vbGVhbiwgcGFsZXR0ZTogQ3VzdG9tUGFsZXR0ZVNldCk6IFRlbXBsYXRlRnJhZ21lbnQge1xyXG4gICAgY29uc3QgYWN0aW9uQnV0dG9uczogVGVtcGxhdGVGcmFnbWVudFtdID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgdHlwZTogJ0J1dHRvbicsXHJcbiAgICAgICAgYWN0aW9uOiBQYWdlc1Byb3ZpZGVyLl9BQ1RJT05fTEFVTkNIX1BBR0UsXHJcbiAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ1RleHQnLFxyXG4gICAgICAgICAgICBkYXRhS2V5OiAnb3BlblRleHQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgdHlwZTogJ0J1dHRvbicsXHJcbiAgICAgICAgYnV0dG9uU3R5bGU6ICdwcmltYXJ5JyBhcyBCdXR0b25TdHlsZS5QcmltYXJ5LFxyXG4gICAgICAgIGFjdGlvbjogUGFnZXNQcm92aWRlci5fQUNUSU9OX0RFTEVURV9QQUdFLFxyXG4gICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdUZXh0JyxcclxuICAgICAgICAgICAgZGF0YUtleTogJ2RlbGV0ZVRleHQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAoZW5hYmxlU2hhcmUpIHtcclxuICAgICAgYWN0aW9uQnV0dG9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnQnV0dG9uJyxcclxuICAgICAgICBidXR0b25TdHlsZTogJ3ByaW1hcnknIGFzIEJ1dHRvblN0eWxlLlByaW1hcnksXHJcbiAgICAgICAgYWN0aW9uOiBQYWdlc1Byb3ZpZGVyLl9BQ1RJT05fU0hBUkVfUEFHRSxcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnVGV4dCcsXHJcbiAgICAgICAgICAgIGRhdGFLZXk6ICdzaGFyZVRleHQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnQ29udGFpbmVyJyxcclxuICAgICAgc3R5bGU6IHtcclxuICAgICAgICBwYWRkaW5nOiAnMTBweCcsXHJcbiAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxyXG4gICAgICAgIGZsZXg6IDEsXHJcbiAgICAgIH0sXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdHlwZTogJ1RleHQnLFxyXG4gICAgICAgICAgZGF0YUtleTogJ3RpdGxlJyxcclxuICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdib2xkJyxcclxuICAgICAgICAgICAgZm9udFNpemU6ICcxNnB4JyxcclxuICAgICAgICAgICAgcGFkZGluZ0JvdHRvbTogJzVweCcsXHJcbiAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzEwcHgnLFxyXG4gICAgICAgICAgICBib3JkZXJCb3R0b206IGAxcHggc29saWQgJHtwYWxldHRlLmJhY2tncm91bmQ2fWAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdHlwZTogJ1RleHQnLFxyXG4gICAgICAgICAgZGF0YUtleTogJ2luc3RydWN0aW9ucycsXHJcbiAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBmbGV4OiAxLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHR5cGU6ICdDb250YWluZXInLFxyXG4gICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgIGdhcDogJzEwcHgnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGNoaWxkcmVuOiBhY3Rpb25CdXR0b25zLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyByZWJ1aWxkUmVzdWx0cyhwbGF0Zm9ybTogV29ya3NwYWNlUGxhdGZvcm1Nb2R1bGUpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IGNvbG9yU2NoZW1lID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldEN1cnJlbnRDb2xvclNjaGVtZU1vZGUoKTtcclxuXHJcbiAgICBjb25zdCBwYWdlczogUGFnZVtdID0gYXdhaXQgcGxhdGZvcm0uU3RvcmFnZS5nZXRQYWdlcygpO1xyXG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMuYnVpbGRSZXN1bHRzKHBsYXRmb3JtLCBwYWdlcywgdGhpcy5fbGFzdFF1ZXJ5LCB0aGlzLl9sYXN0UXVlcnlNaW5MZW5ndGgsIGNvbG9yU2NoZW1lKTtcclxuICAgIHRoaXMucmVzdWx0QWRkVXBkYXRlKHJlc3VsdHMpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBidWlsZFJlc3VsdHMocGxhdGZvcm06IFdvcmtzcGFjZVBsYXRmb3JtTW9kdWxlLCBwYWdlczogUGFnZVtdLCBxdWVyeTogc3RyaW5nLCBxdWVyeU1pbkxlbmd0aDogbnVtYmVyLCBjb2xvclNjaGVtZTogQ29sb3JTY2hlbWVNb2RlKTogUHJvbWlzZTxIb21lU2VhcmNoUmVzdWx0W10+IHtcclxuICAgIGxldCByZXN1bHRzOiBIb21lU2VhcmNoUmVzdWx0W10gPSBbXTtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShwYWdlcykpIHtcclxuICAgICAgY29uc3Qgc2hhcmVFbmFibGVkOiBib29sZWFuID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmNvbmRpdGlvbignc2hhcmluZycpO1xyXG4gICAgICBjb25zdCBwYWxldHRlOiBDdXN0b21QYWxldHRlU2V0ID0gYXdhaXQgdGhpcy5faW50ZWdyYXRpb25IZWxwZXJzLmdldEN1cnJlbnRQYWxldHRlKCk7XHJcblxyXG4gICAgICByZXN1bHRzID0gcGFnZXNcclxuICAgICAgICAuZmlsdGVyKChwZykgPT4gcXVlcnkubGVuZ3RoID09PSAwIHx8IChxdWVyeS5sZW5ndGggPj0gcXVlcnlNaW5MZW5ndGggJiYgcGcudGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSkpKVxyXG4gICAgICAgIC5tYXAoKHBnOiBQYWdlKSA9PiB0aGlzLmdldFBhZ2VUZW1wbGF0ZShwZy5wYWdlSWQsIHBnLnRpdGxlLCBzaGFyZUVuYWJsZWQsIGNvbG9yU2NoZW1lLCBwYWxldHRlKSlcclxuICAgICAgICAuc29ydCgoYSwgYikgPT4gYS50aXRsZS5sb2NhbGVDb21wYXJlKGIudGl0bGUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVzdWx0QWRkVXBkYXRlKHJlc3VsdHM6IEhvbWVTZWFyY2hSZXN1bHRbXSk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX2xhc3RSZXN1bHRzKSB7XHJcbiAgICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcclxuICAgICAgICBjb25zdCByZXN1bHRJbmRleCA9IHRoaXMuX2xhc3RSZXN1bHRzLmZpbmRJbmRleCgocmVzKSA9PiByZXMua2V5ID09PSByZXN1bHQua2V5KTtcclxuICAgICAgICBpZiAocmVzdWx0SW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgdGhpcy5fbGFzdFJlc3VsdHMuc3BsaWNlKHJlc3VsdEluZGV4LCAxLCByZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLl9sYXN0UmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fbGFzdFJlc3BvbnNlKSB7XHJcbiAgICAgIHRoaXMuX2xhc3RSZXNwb25zZS5yZXNwb25kKHJlc3VsdHMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZXN1bHRSZW1vdmUoaWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX2xhc3RSZXN1bHRzKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdEluZGV4ID0gdGhpcy5fbGFzdFJlc3VsdHMuZmluZEluZGV4KChyZXMpID0+IHJlcy5rZXkgPT09IGlkKTtcclxuICAgICAgaWYgKHJlc3VsdEluZGV4ID49IDApIHtcclxuICAgICAgICB0aGlzLl9sYXN0UmVzdWx0cy5zcGxpY2UocmVzdWx0SW5kZXgsIDEpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fbGFzdFJlc3BvbnNlKSB7XHJcbiAgICAgIHRoaXMuX2xhc3RSZXNwb25zZS5yZXZva2UoaWQpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IFBhZ2VzUHJvdmlkZXIgfSBmcm9tIFwiLi9pbnRlZ3JhdGlvblwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IGVudHJ5UG9pbnRzOiB7IFtpZDogc3RyaW5nXTogUGFnZXNQcm92aWRlciB9ID0ge1xyXG5cdGludGVncmF0aW9uczogbmV3IFBhZ2VzUHJvdmlkZXIoKVxyXG59O1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=