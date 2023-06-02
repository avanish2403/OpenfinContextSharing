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

/***/ "./client/src/modules/auth/login/auth-provider.ts":
/*!********************************************************!*\
  !*** ./client/src/modules/auth/login/auth-provider.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ExampleAuthProvider: () => (/* binding */ ExampleAuthProvider)
/* harmony export */ });
/* harmony import */ var _framework_uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../framework/uuid */ "./client/src/framework/uuid.ts");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util */ "./client/src/modules/auth/login/util.ts");


class ExampleAuthProvider {
    /**
     * Create a new instance of ExampleAuthProvider.
     */
    constructor() {
        this.removeUser = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('companyUserId');
            localStorage.removeItem('authenticationType');
            localStorage.removeItem('isOpenfinAuthenticated');
        };
        this._subscribeIdMap = {};
        this._loggedInSubscribers = new Map();
        this._beforeLoggedOutSubscribers = new Map();
        this._loggedOutSubscribers = new Map();
        this._sessionExpiredSubscribers = new Map();
    }
    /**
     * Initialise the module.
     * @param definition The definition of the module from configuration include custom options.
     * @param loggerCreator For logging entries.
     * @param helpers Helper methods for the module to interact with the application core.
     * @returns Nothing.
     */
    async initialize(definition, createLogger, helpers) {
        this._logger = createLogger('AuthOpenfin');
        if (this._authOptions === undefined) {
            this._logger.info(`Setting options: ${JSON.stringify(definition.data, null, 4)}`);
            this._authOptions = definition.data;
            if (this._authenticated) {
                this._currentUser = (0,_util__WEBPACK_IMPORTED_MODULE_1__.getCurrentUser)();
                this.checkForSessionExpiry();
            }
        }
        else {
            this._logger.warn('Options have already been set as init has already been called');
        }
    }
    /**
     * Subscribe to one of the auth events.
     * @param to The event to subscribe to.
     * @param callback The callback to fire when the event occurs.
     * @returns Subscription id for unsubscribing or undefined if event type is not available.
     */
    subscribe(to, callback) {
        const key = (0,_framework_uuid__WEBPACK_IMPORTED_MODULE_0__.randomUUID)();
        let matchFound = false;
        switch (to) {
            case 'logged-in': {
                matchFound = true;
                this._loggedInSubscribers.set(key, callback);
                break;
            }
            case 'before-logged-out': {
                matchFound = true;
                this._beforeLoggedOutSubscribers.set(key, callback);
                break;
            }
            case 'logged-out': {
                matchFound = true;
                this._loggedOutSubscribers.set(key, callback);
                break;
            }
            case 'session-expired': {
                matchFound = true;
                this._sessionExpiredSubscribers.set(key, callback);
                break;
            }
        }
        if (matchFound) {
            this._subscribeIdMap[key] = to;
            this._logger.info(`Subscription to ${to} events registered. Subscription Id: ${key}`);
            return key;
        }
        return null;
    }
    /**
     * Unsubscribe from an already subscribed event.
     * @param subscriptionId The id of the subscription returned from subscribe.
     * @returns True if the unsubscribe was successful.
     */
    unsubscribe(from) {
        let matchFound = false;
        const eventType = this._subscribeIdMap[from];
        if (eventType === undefined) {
            this._logger.warn(`You have tried to unsubscribe with a key ${from} that is invalid`);
            return false;
        }
        switch (eventType) {
            case 'logged-in': {
                matchFound = true;
                this._loggedInSubscribers.delete(from);
                break;
            }
            case 'before-logged-out': {
                matchFound = true;
                this._beforeLoggedOutSubscribers.delete(from);
                break;
            }
            case 'logged-out': {
                matchFound = true;
                this._loggedOutSubscribers.delete(from);
                break;
            }
            case 'session-expired': {
                matchFound = true;
                this._sessionExpiredSubscribers.delete(from);
                break;
            }
        }
        delete this._subscribeIdMap[from];
        if (matchFound) {
            this._logger.info(`Subscription to ${eventType} events with subscription Id: ${from} has been cleared`);
            return true;
        }
        this._logger.warn(`Subscription to ${eventType} events with subscription Id: ${from} could not be cleared as we do not have a register of that event type.`);
        return false;
    }
    /**
     * Does the auth provider require authentication.
     * @returns True if authentication is required.
     */
    async isAuthenticationRequired() {
        if (this._authenticated === undefined) {
            this._authenticated = false;
        }
        return !this._authenticated;
    }
    /**
     * Perform the login operation on the auth provider.
     * @returns True if the login was successful.
     */
    async login() {
        this._logger.info('login requested');
        if (this._authenticated) {
            this._logger.info('User already authenticated');
            return this._authenticated;
        }
        if (this._authOptions.autoLogin) {
            this._logger.info('autoLogin enabled in auth provide module settings. Fake logged in');
            this._authenticated = true;
        }
        else {
            this._authenticated = await this.getAuthenticationFromUser();
        }
        if (this._authenticated) {
            this.checkForSessionExpiry();
            await this.notifySubscribers('logged-in', this._loggedInSubscribers);
        }
        else {
            (0,_util__WEBPACK_IMPORTED_MODULE_1__.clearCurrentUser)();
        }
        return this._authenticated;
    }
    /**
     * Perform the logout operation on the auth provider.
     * @returns True if the logout was successful.
     */
    async logout() {
        return new Promise((resolve, reject) => {
            this.handleLogout(resolve)
                .then(async () => {
                this._logger.info('Log out called');
                return true;
            })
                .catch(async (error) => {
                this._logger.error(`Error while trying to log out ${error}`);
            });
        });
    }
    /**
     * Get user information from the auth provider.
     */
    async getUserInfo() {
        if (this._authenticated === undefined || !this._authenticated) {
            this._logger.warn('Unable to retrieve user info unless the user is authenticated');
            return null;
        }
        this._logger.info('This example returns a user if it was provided to the example login');
        return this._currentUser;
    }
    async getAuthenticationFromUser() {
        return new Promise((resolve, reject) => {
            this.openLoginWindow(this._authOptions.loginUrl)
                .then(async (win) => {
                const authMatch = new RegExp(this._authOptions.authenticatedUrl, 'i');
                try {
                    if (win !== undefined) {
                        const info = await win.getInfo();
                        if (authMatch.test(info.url)) {
                            await win.close(true);
                            return resolve(true);
                        }
                        await win.show(true);
                    }
                }
                catch (error) {
                    this._logger.error(`Error while checking if login window automatically redirected. Error ${error.message}`);
                    if (win !== undefined) {
                        await win.show(true);
                    }
                }
                let statusCheck;
                await win.addListener('closed', async () => {
                    if (win) {
                        window.clearInterval(statusCheck);
                        statusCheck = undefined;
                        this._logger.info('Auth Window cancelled by user');
                        win = undefined;
                        return resolve(false);
                    }
                });
                statusCheck = window.setInterval(async () => {
                    if (win !== undefined) {
                        const info = await win.getInfo();
                        if (localStorage.getItem('isOpenfinAuthenticated') === 'true') {
                            this._authenticated = true;
                        }
                        if (this._authenticated) {
                            window.clearInterval(statusCheck);
                            await win.removeAllListeners();
                            await win.close(true);
                            return resolve(true);
                        }
                    }
                    else {
                        return resolve(false);
                    }
                }, this._authOptions.checkLoginStatusInSeconds ?? 1 * 1000);
                return true;
            })
                .catch((error) => {
                this._logger.error('Error while trying to authenticate the user', error);
            });
        });
    }
    checkForSessionExpiry(force = false) {
        if (this._authOptions?.checkSessionValidityInSeconds !== undefined && this._authOptions?.checkSessionValidityInSeconds > -1 && this._sessionExpiryCheckId === undefined) {
            this._sessionExpiryCheckId = window.setTimeout(async () => {
                this._sessionExpiryCheckId = undefined;
                const stillAuthenticated = await this.checkAuth(this._authOptions.loginUrl);
                if (stillAuthenticated) {
                    this._logger.info('Session Still Active');
                    this.checkForSessionExpiry();
                }
                else {
                    this._logger.info('Session not valid. Killing session and notifying registered callback that authentication is required. This check is configured in the data for this auth module. Set checkSessionValidityInSeconds to -1 in the authProvider module definition if you wish to disable this check');
                    this._authenticated = false;
                    (0,_util__WEBPACK_IMPORTED_MODULE_1__.clearCurrentUser)();
                    await this.notifySubscribers('session-expired', this._sessionExpiredSubscribers);
                }
            }, this._authOptions.checkSessionValidityInSeconds * 1000);
        }
    }
    async notifySubscribers(eventType, subscribers) {
        const subscriberIds = Array.from(subscribers.keys());
        subscriberIds.reverse();
        for (let i = 0; i < subscriberIds.length; i++) {
            const subscriberId = subscriberIds[i];
            this._logger.info(`Notifying subscriber with subscription Id: ${subscriberId} of event type: ${eventType}`);
            await subscribers.get(subscriberId)();
        }
    }
    async handleLogout(resolve) {
        if (this._authenticated === undefined || !this._authenticated) {
            this._logger.error('You have requested to log out but are not logged in');
            resolve(false);
            return;
        }
        this._logger.info('Log out requested');
        await this.notifySubscribers('before-logged-out', this._beforeLoggedOutSubscribers);
        this._authenticated = false;
        (0,_util__WEBPACK_IMPORTED_MODULE_1__.clearCurrentUser)();
        if (this._authOptions.logoutUrl !== undefined && this._authOptions.logoutUrl !== null && this._authOptions.logoutUrl.trim().length > 0) {
            try {
                const win = await this.openLogoutWindow(this._authOptions.logoutUrl);
                setTimeout(async () => {
                    await win.close();
                    await this.notifySubscribers('logged-out', this._loggedOutSubscribers);
                    resolve(true);
                }, 2000);
            }
            catch (error) {
                this._logger.error(`Error while launching logout window. ${error}`);
                return resolve(false);
            }
        }
        if (localStorage.getItem('authenticationType') === 'DATABASE_LOGIN' && localStorage.getItem('token')) {
            const win = await this.openLogoutWindow(this._authOptions.logoutUrl);
            window.location.href = 'http://localhost:8082/Logout';
            this.removeUser();
            await win.close();
        }
        else {
            await this.notifySubscribers('logged-out', this._loggedOutSubscribers);
            resolve(true);
        }
    }
    async openLoginWindow(url) {
        const enrichedCustomData = {
            currentUserKey: _util__WEBPACK_IMPORTED_MODULE_1__.EXAMPLE_AUTH_CURRENT_USER_KEY,
            ...this._authOptions?.customData,
        };
        return fin.Window.create({
            name: 'auth-log-in',
            alwaysOnTop: false,
            maximizable: false,
            minimizable: true,
            autoShow: false,
            defaultCentered: true,
            defaultHeight: this._authOptions.loginHeight ?? 600,
            defaultWidth: this._authOptions.loginWidth ?? 500,
            includeInSnapshots: false,
            resizable: false,
            showTaskbarIcon: true,
            saveWindowState: false,
            url,
            customData: enrichedCustomData,
        });
    }
    async openLogoutWindow(url) {
        return fin.Window.create({
            name: 'auth-log-out',
            maximizable: false,
            minimizable: false,
            autoShow: false,
            defaultCentered: true,
            defaultHeight: this._authOptions.loginHeight ?? 320,
            defaultWidth: this._authOptions.loginWidth ?? 400,
            includeInSnapshots: false,
            resizable: false,
            showTaskbarIcon: false,
            saveWindowState: false,
            url,
        });
    }
    async checkAuth(url) {
        const windowToCheck = await fin.Window.create({
            name: 'auth-check-window',
            alwaysOnTop: true,
            maximizable: false,
            minimizable: false,
            autoShow: false,
            defaultHeight: this._authOptions.loginHeight ?? 325,
            defaultWidth: this._authOptions.loginWidth ?? 400,
            includeInSnapshots: false,
            resizable: false,
            showTaskbarIcon: false,
            saveWindowState: false,
            url,
        });
        let isAuthenticated = false;
        try {
            const info = await windowToCheck.getInfo();
            if (info.url === this._authOptions.authenticatedUrl) {
                isAuthenticated = true;
            }
        }
        catch (error) {
            this._logger.error('Error encountered while checking session', error);
        }
        finally {
            if (windowToCheck !== undefined) {
                await windowToCheck.close(true);
            }
        }
        return isAuthenticated;
    }
}


/***/ }),

/***/ "./client/src/modules/auth/login/endpoint.ts":
/*!***************************************************!*\
  !*** ./client/src/modules/auth/login/endpoint.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ExampleAuthEndpoint: () => (/* binding */ ExampleAuthEndpoint)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./client/src/modules/auth/login/util.ts");

class ExampleAuthEndpoint {
    /**
     * Initialise the module.
     * @param definition The definition of the module from configuration include custom options.
     * @param loggerCreator For logging entries.
     * @param helpers Helper methods for the module to interact with the application core.
     * @returns Nothing.
     */
    async initialize(definition, createLogger, helpers) {
        this._logger = createLogger('ExampleAuthEndpoint');
        this._logger.info('Was passed the following options', definition.data);
        this._roleMapping = definition?.data?.roleMapping;
        this._definition = definition;
    }
    /**
     * Handle a request response on an endpoint.
     * @param endpointDefinition The definition of the endpoint.
     * @param request The request to process.
     * @returns The response to the request, or null of not handled.
     */
    async requestResponse(endpointDefinition, request) {
        if (endpointDefinition.type !== 'module') {
            this._logger.warn(`We only expect endpoints of type module. Unable to action request/response for: ${endpointDefinition.id}`);
            return null;
        }
        if (this._logger !== undefined) {
            this._logger.info('This auth endpoint module is an example that that simulates requesting a http endpoint and manipulating it based on the current example user as if it was the server doing the manipulation. DO NOT USE THIS MODULE IN PRODUCTION.');
        }
        const { url, ...options } = endpointDefinition.options;
        const req = this.getRequestOptions(url, options, request);
        if (req.options.method !== 'GET' && req.options.method !== 'POST') {
            this._logger.warn(`${endpointDefinition.id} specifies a type: ${endpointDefinition.type} with a method ${req.options.method} that is not supported.`);
            return null;
        }
        const response = await fetch(req.url, req.options);
        if (response.ok) {
            const json = await response.json();
            if (Array.isArray(json)) {
                // returned apps
                return this.applyCurrentUserToApps(json);
            }
            // settings
            return this.applyCurrentUserToSettings(json);
        }
        return null;
    }
    getRequestOptions(url, options, request) {
        if (options.method === 'GET') {
            if (request !== undefined) {
                const keys = Object.keys(request);
                if (keys.length > 0) {
                    const length = keys.length;
                    for (let i = 0; i < length; i++) {
                        url = url.replace(`[${keys[i]}]`, encodeURIComponent(request[keys[i]]));
                    }
                }
            }
        }
        else if (options.method === 'POST' && request !== undefined) {
            options.body = JSON.stringify(request);
        }
        return { url, options };
    }
    applyCurrentUserToApps(apps = []) {
        const currentUser = (0,_util__WEBPACK_IMPORTED_MODULE_0__.getCurrentUser)();
        if (currentUser === null ||
            this._roleMapping === undefined ||
            this._roleMapping[currentUser.role] === undefined ||
            this._roleMapping[currentUser.role].excludeAppsWithTag === undefined) {
            return apps;
        }
        const excludeTag = this._roleMapping[currentUser.role].excludeAppsWithTag;
        const filteredApps = [];
        for (let i = 0; i < apps.length; i++) {
            if (Array.isArray(apps[i].tags)) {
                let include = true;
                for (let t = 0; t < apps[i].tags.length; t++) {
                    const tag = apps[i].tags[t];
                    if (excludeTag.includes(tag)) {
                        include = false;
                        break;
                    }
                }
                if (include) {
                    filteredApps.push(apps[i]);
                }
            }
            else {
                filteredApps.push(apps[i]);
            }
        }
        return filteredApps;
    }
    applyCurrentUserToSettings(settings) {
        const currentUser = (0,_util__WEBPACK_IMPORTED_MODULE_0__.getCurrentUser)();
        if (currentUser === null || this._roleMapping === undefined || this._roleMapping[currentUser.role] === undefined) {
            return settings;
        }
        if (Array.isArray(settings?.endpointProvider?.modules)) {
            settings.endpointProvider.modules.push({
                data: this._definition,
                enabled: this._definition.enabled,
                id: this._definition.id,
                description: this._definition.description,
                icon: this._definition.icon,
                info: this._definition.info,
                title: this._definition.title,
                url: this._definition.url,
            });
            if (Array.isArray(settings?.endpointProvider?.endpoints) && Array.isArray(settings?.appProvider?.endpointIds)) {
                const appEndpoints = settings?.appProvider?.endpointIds;
                for (let i = 0; i < appEndpoints.length; i++) {
                    if (typeof appEndpoints[i] === 'string') {
                        const endpointToUpdate = settings.endpointProvider.endpoints.find((endpointEntry) => endpointEntry.id === appEndpoints[i] && endpointEntry.type === 'fetch');
                        if (endpointToUpdate !== undefined) {
                            endpointToUpdate.type = 'module';
                            // this if condition check is here to make typescript happy with the endpoint so that typeId can be set
                            if (endpointToUpdate.type === 'module') {
                                endpointToUpdate.typeId = this._definition.id;
                            }
                        }
                    }
                }
            }
        }
        if (Array.isArray(settings?.themeProvider?.themes) && settings.themeProvider.themes.length > 0 && this._roleMapping[currentUser.role].preferredScheme !== undefined) {
            settings.themeProvider.themes[0].default = this._roleMapping[currentUser.role].preferredScheme === 'dark' ? 'dark' : 'light';
            const storedSchemePreference = `${fin.me.identity.uuid}-SelectedColorScheme`;
            this._logger.warn("This is a demo module where we are clearing the locally stored scheme preference in order to show different scheme's light/dark based on user selection. This means that it will always be set to what is in the role mapping initially and not what it is set to locally on restart.");
            localStorage.removeItem(storedSchemePreference);
        }
        const excludeMenuActionIds = this._roleMapping[currentUser.role].excludeMenuAction;
        if (Array.isArray(excludeMenuActionIds)) {
            if (Array.isArray(settings?.browserProvider?.globalMenu) && settings.browserProvider.globalMenu.length > 0) {
                for (let i = 0; i < settings.browserProvider.globalMenu.length; i++) {
                    const globalMenuActionId = settings.browserProvider.globalMenu[i]?.data?.action?.id;
                    if (excludeMenuActionIds.includes(globalMenuActionId)) {
                        settings.browserProvider.globalMenu[i].include = false;
                    }
                }
            }
            if (Array.isArray(settings?.browserProvider?.pageMenu) && settings.browserProvider.pageMenu.length > 0) {
                for (let i = 0; i < settings.browserProvider.pageMenu.length; i++) {
                    const pageMenuActionId = settings.browserProvider.pageMenu[i]?.data?.action?.id;
                    if (excludeMenuActionIds.includes(pageMenuActionId)) {
                        settings.browserProvider.pageMenu[i].include = false;
                    }
                }
            }
            if (Array.isArray(settings?.browserProvider?.viewMenu) && settings.browserProvider.viewMenu.length > 0) {
                for (let i = 0; i < settings.browserProvider.viewMenu.length; i++) {
                    const viewMenuActionId = settings.browserProvider.viewMenu[i]?.data?.action?.id;
                    if (excludeMenuActionIds.includes(viewMenuActionId)) {
                        settings.browserProvider.viewMenu[i].include = false;
                    }
                }
            }
        }
        return settings;
    }
}


/***/ }),

/***/ "./client/src/modules/auth/login/util.ts":
/*!***********************************************!*\
  !*** ./client/src/modules/auth/login/util.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EXAMPLE_AUTH_CURRENT_USER_KEY: () => (/* binding */ EXAMPLE_AUTH_CURRENT_USER_KEY),
/* harmony export */   clearCurrentUser: () => (/* binding */ clearCurrentUser),
/* harmony export */   getCurrentUser: () => (/* binding */ getCurrentUser),
/* harmony export */   setCurrentUser: () => (/* binding */ setCurrentUser)
/* harmony export */ });
const EXAMPLE_AUTH_CURRENT_USER_KEY = `${fin.me.identity.uuid}-EXAMPLE_AUTH_CURRENT_USER`;
function getCurrentUser() {
    const storedUser = localStorage.getItem(EXAMPLE_AUTH_CURRENT_USER_KEY);
    if (storedUser === null) {
        return null;
    }
    return JSON.parse(storedUser);
}
function setCurrentUser(user) {
    localStorage.setItem(EXAMPLE_AUTH_CURRENT_USER_KEY, JSON.stringify(user));
}
function clearCurrentUser() {
    localStorage.removeItem(EXAMPLE_AUTH_CURRENT_USER_KEY);
}


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
/*!************************************************!*\
  !*** ./client/src/modules/auth/login/index.ts ***!
  \************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   entryPoints: () => (/* binding */ entryPoints)
/* harmony export */ });
/* harmony import */ var _auth_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./auth-provider */ "./client/src/modules/auth/login/auth-provider.ts");
/* harmony import */ var _endpoint__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./endpoint */ "./client/src/modules/auth/login/endpoint.ts");


const entryPoints = {
    auth: new _auth_provider__WEBPACK_IMPORTED_MODULE_0__.ExampleAuthProvider(),
    endpoint: new _endpoint__WEBPACK_IMPORTED_MODULE_1__.ExampleAuthEndpoint(),
};

})();

var __webpack_exports__entryPoints = __webpack_exports__.entryPoints;
export { __webpack_exports__entryPoints as entryPoints };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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SUFDL0IsWUFBWSxDQUFDLFVBQVUsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQ3hELENBQUM7Ozs7Ozs7U0NsQkQ7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTs7U0FFQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTs7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0E7VUFDQSx5Q0FBeUMsd0NBQXdDO1VBQ2pGO1VBQ0E7VUFDQTs7Ozs7VUNQQTs7Ozs7VUNBQTtVQUNBO1VBQ0E7VUFDQSx1REFBdUQsaUJBQWlCO1VBQ3hFO1VBQ0EsZ0RBQWdELGFBQWE7VUFDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7QUNMc0Q7QUFDTDtBQUUxQyxNQUFNLFdBQVcsR0FBcUQ7SUFDM0UsSUFBSSxFQUFFLElBQUksK0RBQW1CLEVBQUU7SUFDL0IsUUFBUSxFQUFFLElBQUksMERBQW1CLEVBQUU7Q0FDcEMsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL29wZW5maW4td29ya3NwYWNlLy4vY2xpZW50L3NyYy9mcmFtZXdvcmsvdXVpZC50cyIsIndlYnBhY2s6Ly9vcGVuZmluLXdvcmtzcGFjZS8uL2NsaWVudC9zcmMvbW9kdWxlcy9hdXRoL2xvZ2luL2F1dGgtcHJvdmlkZXIudHMiLCJ3ZWJwYWNrOi8vb3BlbmZpbi13b3Jrc3BhY2UvLi9jbGllbnQvc3JjL21vZHVsZXMvYXV0aC9sb2dpbi9lbmRwb2ludC50cyIsIndlYnBhY2s6Ly9vcGVuZmluLXdvcmtzcGFjZS8uL2NsaWVudC9zcmMvbW9kdWxlcy9hdXRoL2xvZ2luL3V0aWwudHMiLCJ3ZWJwYWNrOi8vb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL29wZW5maW4td29ya3NwYWNlL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9vcGVuZmluLXdvcmtzcGFjZS8uL2NsaWVudC9zcmMvbW9kdWxlcy9hdXRoL2xvZ2luL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiByYW5kb21VVUlEKCk6IHN0cmluZyB7XHJcblx0aWYgKFwicmFuZG9tVVVJRFwiIGluIHdpbmRvdy5jcnlwdG8pIHtcclxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxyXG5cdFx0cmV0dXJuIHdpbmRvdy5jcnlwdG8ucmFuZG9tVVVJRCgpO1xyXG5cdH1cclxuXHQvLyBQb2x5ZmlsbCB0aGUgd2luZG93LmNyeXB0by5yYW5kb21VVUlEIGlmIHdlIGFyZSBydW5uaW5nIGluIGEgbm9uIHNlY3VyZSBjb250ZXh0IHRoYXQgZG9lc24ndCBoYXZlIGl0XHJcblx0Ly8gd2UgYXJlIHN0aWxsIHVzaW5nIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzIHdoaWNoIGlzIGFsd2F5cyBhdmFpbGFibGVcclxuXHQvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjExNzUyMy8yODAwMjE4XHJcblx0Y29uc3QgZ2V0UmFuZG9tSGV4ID0gKGMpID0+XHJcblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYml0d2lzZSwgbm8tbWl4ZWQtb3BlcmF0b3JzXHJcblx0XHQoYyBeICh3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheSgxKSlbMF0gJiAoMTUgPj4gKGMgLyA0KSkpKS50b1N0cmluZygxNik7XHJcblx0cmV0dXJuIFwiMTAwMDAwMDAtMTAwMC00MDAwLTgwMDAtMTAwMDAwMDAwMDAwXCIucmVwbGFjZSgvWzAxOF0vZywgZ2V0UmFuZG9tSGV4KTtcclxufVxyXG4iLCJpbXBvcnQgdHlwZSB7IEF1dGhQcm92aWRlciB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL2F1dGgtc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBMb2dnZXIsIExvZ2dlckNyZWF0b3IgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy9sb2dnZXItc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBNb2R1bGVEZWZpbml0aW9uLCBNb2R1bGVIZWxwZXJzIH0gZnJvbSAnY3VzdG9taXplLXdvcmtzcGFjZS9zaGFwZXMvbW9kdWxlLXNoYXBlcyc7XHJcbmltcG9ydCB7IHJhbmRvbVVVSUQgfSBmcm9tICcuLi8uLi8uLi9mcmFtZXdvcmsvdXVpZCc7XHJcbmltcG9ydCB0eXBlIHsgRXhhbXBsZU9wdGlvbnMsIEV4YW1wbGVVc2VyIH0gZnJvbSAnLi9zaGFwZXMnO1xyXG5pbXBvcnQgeyBjbGVhckN1cnJlbnRVc2VyLCBFWEFNUExFX0FVVEhfQ1VSUkVOVF9VU0VSX0tFWSwgZ2V0Q3VycmVudFVzZXIgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEV4YW1wbGVBdXRoUHJvdmlkZXIgaW1wbGVtZW50cyBBdXRoUHJvdmlkZXI8RXhhbXBsZU9wdGlvbnM+IHtcclxuICBwcml2YXRlIF9hdXRoT3B0aW9uczogRXhhbXBsZU9wdGlvbnM7XHJcblxyXG4gIHByaXZhdGUgX2xvZ2dlcjogTG9nZ2VyO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9zdWJzY3JpYmVJZE1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfbG9nZ2VkSW5TdWJzY3JpYmVyczogTWFwPHN0cmluZywgKCkgPT4gUHJvbWlzZTx2b2lkPj47XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2JlZm9yZUxvZ2dlZE91dFN1YnNjcmliZXJzOiBNYXA8c3RyaW5nLCAoKSA9PiBQcm9taXNlPHZvaWQ+PjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfbG9nZ2VkT3V0U3Vic2NyaWJlcnM6IE1hcDxzdHJpbmcsICgpID0+IFByb21pc2U8dm9pZD4+O1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9zZXNzaW9uRXhwaXJlZFN1YnNjcmliZXJzOiBNYXA8c3RyaW5nLCAoKSA9PiBQcm9taXNlPHZvaWQ+PjtcclxuXHJcbiAgcHJpdmF0ZSBfY3VycmVudFVzZXI6IEV4YW1wbGVVc2VyO1xyXG5cclxuICBwcml2YXRlIF9hdXRoZW50aWNhdGVkOiBib29sZWFuO1xyXG5cclxuICBwcml2YXRlIF9zZXNzaW9uRXhwaXJ5Q2hlY2tJZDogbnVtYmVyO1xyXG5cclxuICByZW1vdmVVc2VyID0gKCkgPT4ge1xyXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XHJcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnY29tcGFueVVzZXJJZCcpO1xyXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2F1dGhlbnRpY2F0aW9uVHlwZScpO1xyXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2lzT3BlbmZpbkF1dGhlbnRpY2F0ZWQnKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgRXhhbXBsZUF1dGhQcm92aWRlci5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuX3N1YnNjcmliZUlkTWFwID0ge307XHJcbiAgICB0aGlzLl9sb2dnZWRJblN1YnNjcmliZXJzID0gbmV3IE1hcCgpO1xyXG4gICAgdGhpcy5fYmVmb3JlTG9nZ2VkT3V0U3Vic2NyaWJlcnMgPSBuZXcgTWFwKCk7XHJcbiAgICB0aGlzLl9sb2dnZWRPdXRTdWJzY3JpYmVycyA9IG5ldyBNYXAoKTtcclxuICAgIHRoaXMuX3Nlc3Npb25FeHBpcmVkU3Vic2NyaWJlcnMgPSBuZXcgTWFwKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXNlIHRoZSBtb2R1bGUuXHJcbiAgICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gb2YgdGhlIG1vZHVsZSBmcm9tIGNvbmZpZ3VyYXRpb24gaW5jbHVkZSBjdXN0b20gb3B0aW9ucy5cclxuICAgKiBAcGFyYW0gbG9nZ2VyQ3JlYXRvciBGb3IgbG9nZ2luZyBlbnRyaWVzLlxyXG4gICAqIEBwYXJhbSBoZWxwZXJzIEhlbHBlciBtZXRob2RzIGZvciB0aGUgbW9kdWxlIHRvIGludGVyYWN0IHdpdGggdGhlIGFwcGxpY2F0aW9uIGNvcmUuXHJcbiAgICogQHJldHVybnMgTm90aGluZy5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgaW5pdGlhbGl6ZShkZWZpbml0aW9uOiBNb2R1bGVEZWZpbml0aW9uPEV4YW1wbGVPcHRpb25zPiwgY3JlYXRlTG9nZ2VyOiBMb2dnZXJDcmVhdG9yLCBoZWxwZXJzOiBNb2R1bGVIZWxwZXJzKSB7XHJcbiAgICB0aGlzLl9sb2dnZXIgPSBjcmVhdGVMb2dnZXIoJ0F1dGhPcGVuZmluJyk7XHJcblxyXG4gICAgaWYgKHRoaXMuX2F1dGhPcHRpb25zID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oYFNldHRpbmcgb3B0aW9uczogJHtKU09OLnN0cmluZ2lmeShkZWZpbml0aW9uLmRhdGEsIG51bGwsIDQpfWApO1xyXG4gICAgICB0aGlzLl9hdXRoT3B0aW9ucyA9IGRlZmluaXRpb24uZGF0YTtcclxuICAgICAgaWYgKHRoaXMuX2F1dGhlbnRpY2F0ZWQpIHtcclxuICAgICAgICB0aGlzLl9jdXJyZW50VXNlciA9IGdldEN1cnJlbnRVc2VyKCk7XHJcbiAgICAgICAgdGhpcy5jaGVja0ZvclNlc3Npb25FeHBpcnkoKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLndhcm4oJ09wdGlvbnMgaGF2ZSBhbHJlYWR5IGJlZW4gc2V0IGFzIGluaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnNjcmliZSB0byBvbmUgb2YgdGhlIGF1dGggZXZlbnRzLlxyXG4gICAqIEBwYXJhbSB0byBUaGUgZXZlbnQgdG8gc3Vic2NyaWJlIHRvLlxyXG4gICAqIEBwYXJhbSBjYWxsYmFjayBUaGUgY2FsbGJhY2sgdG8gZmlyZSB3aGVuIHRoZSBldmVudCBvY2N1cnMuXHJcbiAgICogQHJldHVybnMgU3Vic2NyaXB0aW9uIGlkIGZvciB1bnN1YnNjcmliaW5nIG9yIHVuZGVmaW5lZCBpZiBldmVudCB0eXBlIGlzIG5vdCBhdmFpbGFibGUuXHJcbiAgICovXHJcbiAgcHVibGljIHN1YnNjcmliZSh0bzogJ2xvZ2dlZC1pbicgfCAnYmVmb3JlLWxvZ2dlZC1vdXQnIHwgJ2xvZ2dlZC1vdXQnIHwgJ3Nlc3Npb24tZXhwaXJlZCcsIGNhbGxiYWNrOiAoKSA9PiBQcm9taXNlPHZvaWQ+KTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGtleSA9IHJhbmRvbVVVSUQoKTtcclxuICAgIGxldCBtYXRjaEZvdW5kID0gZmFsc2U7XHJcbiAgICBzd2l0Y2ggKHRvKSB7XHJcbiAgICAgIGNhc2UgJ2xvZ2dlZC1pbic6IHtcclxuICAgICAgICBtYXRjaEZvdW5kID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9sb2dnZWRJblN1YnNjcmliZXJzLnNldChrZXksIGNhbGxiYWNrKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICBjYXNlICdiZWZvcmUtbG9nZ2VkLW91dCc6IHtcclxuICAgICAgICBtYXRjaEZvdW5kID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9iZWZvcmVMb2dnZWRPdXRTdWJzY3JpYmVycy5zZXQoa2V5LCBjYWxsYmFjayk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnbG9nZ2VkLW91dCc6IHtcclxuICAgICAgICBtYXRjaEZvdW5kID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9sb2dnZWRPdXRTdWJzY3JpYmVycy5zZXQoa2V5LCBjYWxsYmFjayk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnc2Vzc2lvbi1leHBpcmVkJzoge1xyXG4gICAgICAgIG1hdGNoRm91bmQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX3Nlc3Npb25FeHBpcmVkU3Vic2NyaWJlcnMuc2V0KGtleSwgY2FsbGJhY2spO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1hdGNoRm91bmQpIHtcclxuICAgICAgdGhpcy5fc3Vic2NyaWJlSWRNYXBba2V5XSA9IHRvO1xyXG4gICAgICB0aGlzLl9sb2dnZXIuaW5mbyhgU3Vic2NyaXB0aW9uIHRvICR7dG99IGV2ZW50cyByZWdpc3RlcmVkLiBTdWJzY3JpcHRpb24gSWQ6ICR7a2V5fWApO1xyXG4gICAgICByZXR1cm4ga2V5O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVbnN1YnNjcmliZSBmcm9tIGFuIGFscmVhZHkgc3Vic2NyaWJlZCBldmVudC5cclxuICAgKiBAcGFyYW0gc3Vic2NyaXB0aW9uSWQgVGhlIGlkIG9mIHRoZSBzdWJzY3JpcHRpb24gcmV0dXJuZWQgZnJvbSBzdWJzY3JpYmUuXHJcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdW5zdWJzY3JpYmUgd2FzIHN1Y2Nlc3NmdWwuXHJcbiAgICovXHJcbiAgcHVibGljIHVuc3Vic2NyaWJlKGZyb206IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgbGV0IG1hdGNoRm91bmQgPSBmYWxzZTtcclxuICAgIGNvbnN0IGV2ZW50VHlwZSA9IHRoaXMuX3N1YnNjcmliZUlkTWFwW2Zyb21dO1xyXG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci53YXJuKGBZb3UgaGF2ZSB0cmllZCB0byB1bnN1YnNjcmliZSB3aXRoIGEga2V5ICR7ZnJvbX0gdGhhdCBpcyBpbnZhbGlkYCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzd2l0Y2ggKGV2ZW50VHlwZSkge1xyXG4gICAgICBjYXNlICdsb2dnZWQtaW4nOiB7XHJcbiAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VkSW5TdWJzY3JpYmVycy5kZWxldGUoZnJvbSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnYmVmb3JlLWxvZ2dlZC1vdXQnOiB7XHJcbiAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fYmVmb3JlTG9nZ2VkT3V0U3Vic2NyaWJlcnMuZGVsZXRlKGZyb20pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ2xvZ2dlZC1vdXQnOiB7XHJcbiAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VkT3V0U3Vic2NyaWJlcnMuZGVsZXRlKGZyb20pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ3Nlc3Npb24tZXhwaXJlZCc6IHtcclxuICAgICAgICBtYXRjaEZvdW5kID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9zZXNzaW9uRXhwaXJlZFN1YnNjcmliZXJzLmRlbGV0ZShmcm9tKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRlbGV0ZSB0aGlzLl9zdWJzY3JpYmVJZE1hcFtmcm9tXTtcclxuICAgIGlmIChtYXRjaEZvdW5kKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKGBTdWJzY3JpcHRpb24gdG8gJHtldmVudFR5cGV9IGV2ZW50cyB3aXRoIHN1YnNjcmlwdGlvbiBJZDogJHtmcm9tfSBoYXMgYmVlbiBjbGVhcmVkYCk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2xvZ2dlci53YXJuKGBTdWJzY3JpcHRpb24gdG8gJHtldmVudFR5cGV9IGV2ZW50cyB3aXRoIHN1YnNjcmlwdGlvbiBJZDogJHtmcm9tfSBjb3VsZCBub3QgYmUgY2xlYXJlZCBhcyB3ZSBkbyBub3QgaGF2ZSBhIHJlZ2lzdGVyIG9mIHRoYXQgZXZlbnQgdHlwZS5gKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERvZXMgdGhlIGF1dGggcHJvdmlkZXIgcmVxdWlyZSBhdXRoZW50aWNhdGlvbi5cclxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGF1dGhlbnRpY2F0aW9uIGlzIHJlcXVpcmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBpc0F1dGhlbnRpY2F0aW9uUmVxdWlyZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBpZiAodGhpcy5fYXV0aGVudGljYXRlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiAhdGhpcy5fYXV0aGVudGljYXRlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBlcmZvcm0gdGhlIGxvZ2luIG9wZXJhdGlvbiBvbiB0aGUgYXV0aCBwcm92aWRlci5cclxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBsb2dpbiB3YXMgc3VjY2Vzc2Z1bC5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgbG9naW4oKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICB0aGlzLl9sb2dnZXIuaW5mbygnbG9naW4gcmVxdWVzdGVkJyk7XHJcbiAgICBpZiAodGhpcy5fYXV0aGVudGljYXRlZCkge1xyXG4gICAgICB0aGlzLl9sb2dnZXIuaW5mbygnVXNlciBhbHJlYWR5IGF1dGhlbnRpY2F0ZWQnKTtcclxuICAgICAgcmV0dXJuIHRoaXMuX2F1dGhlbnRpY2F0ZWQ7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fYXV0aE9wdGlvbnMuYXV0b0xvZ2luKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKCdhdXRvTG9naW4gZW5hYmxlZCBpbiBhdXRoIHByb3ZpZGUgbW9kdWxlIHNldHRpbmdzLiBGYWtlIGxvZ2dlZCBpbicpO1xyXG4gICAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSBhd2FpdCB0aGlzLmdldEF1dGhlbnRpY2F0aW9uRnJvbVVzZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fYXV0aGVudGljYXRlZCkge1xyXG4gICAgICB0aGlzLmNoZWNrRm9yU2Vzc2lvbkV4cGlyeSgpO1xyXG4gICAgICBhd2FpdCB0aGlzLm5vdGlmeVN1YnNjcmliZXJzKCdsb2dnZWQtaW4nLCB0aGlzLl9sb2dnZWRJblN1YnNjcmliZXJzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNsZWFyQ3VycmVudFVzZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5fYXV0aGVudGljYXRlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBlcmZvcm0gdGhlIGxvZ291dCBvcGVyYXRpb24gb24gdGhlIGF1dGggcHJvdmlkZXIuXHJcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbG9nb3V0IHdhcyBzdWNjZXNzZnVsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBsb2dvdXQoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmhhbmRsZUxvZ291dChyZXNvbHZlKVxyXG4gICAgICAgIC50aGVuKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKCdMb2cgb3V0IGNhbGxlZCcpO1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goYXN5bmMgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLl9sb2dnZXIuZXJyb3IoYEVycm9yIHdoaWxlIHRyeWluZyB0byBsb2cgb3V0ICR7ZXJyb3J9YCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB1c2VyIGluZm9ybWF0aW9uIGZyb20gdGhlIGF1dGggcHJvdmlkZXIuXHJcbiAgICovXHJcbiAgcHVibGljIGFzeW5jIGdldFVzZXJJbmZvKCk6IFByb21pc2U8dW5rbm93bj4ge1xyXG4gICAgaWYgKHRoaXMuX2F1dGhlbnRpY2F0ZWQgPT09IHVuZGVmaW5lZCB8fCAhdGhpcy5fYXV0aGVudGljYXRlZCkge1xyXG4gICAgICB0aGlzLl9sb2dnZXIud2FybignVW5hYmxlIHRvIHJldHJpZXZlIHVzZXIgaW5mbyB1bmxlc3MgdGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZCcpO1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIHRoaXMuX2xvZ2dlci5pbmZvKCdUaGlzIGV4YW1wbGUgcmV0dXJucyBhIHVzZXIgaWYgaXQgd2FzIHByb3ZpZGVkIHRvIHRoZSBleGFtcGxlIGxvZ2luJyk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRVc2VyO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGdldEF1dGhlbnRpY2F0aW9uRnJvbVVzZXIoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLm9wZW5Mb2dpbldpbmRvdyh0aGlzLl9hdXRoT3B0aW9ucy5sb2dpblVybClcclxuICAgICAgICAudGhlbihhc3luYyAod2luKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBhdXRoTWF0Y2ggPSBuZXcgUmVnRXhwKHRoaXMuX2F1dGhPcHRpb25zLmF1dGhlbnRpY2F0ZWRVcmwsICdpJyk7XHJcblxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHdpbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IHdpbi5nZXRJbmZvKCk7XHJcbiAgICAgICAgICAgICAgaWYgKGF1dGhNYXRjaC50ZXN0KGluZm8udXJsKSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgd2luLmNsb3NlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGF3YWl0IHdpbi5zaG93KHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIuZXJyb3IoYEVycm9yIHdoaWxlIGNoZWNraW5nIGlmIGxvZ2luIHdpbmRvdyBhdXRvbWF0aWNhbGx5IHJlZGlyZWN0ZWQuIEVycm9yICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgICAgICAgaWYgKHdpbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgd2luLnNob3codHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgc3RhdHVzQ2hlY2s6IG51bWJlcjtcclxuXHJcbiAgICAgICAgICBhd2FpdCB3aW4uYWRkTGlzdGVuZXIoJ2Nsb3NlZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHdpbikge1xyXG4gICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHN0YXR1c0NoZWNrKTtcclxuICAgICAgICAgICAgICBzdGF0dXNDaGVjayA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIuaW5mbygnQXV0aCBXaW5kb3cgY2FuY2VsbGVkIGJ5IHVzZXInKTtcclxuICAgICAgICAgICAgICB3aW4gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHN0YXR1c0NoZWNrID0gd2luZG93LnNldEludGVydmFsKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHdpbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IHdpbi5nZXRJbmZvKCk7XHJcbiAgICAgICAgICAgICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdpc09wZW5maW5BdXRoZW50aWNhdGVkJykgPT09ICd0cnVlJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmICh0aGlzLl9hdXRoZW50aWNhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChzdGF0dXNDaGVjayk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB3aW4ucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB3aW4uY2xvc2UodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh0cnVlKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCB0aGlzLl9hdXRoT3B0aW9ucy5jaGVja0xvZ2luU3RhdHVzSW5TZWNvbmRzID8/IDEgKiAxMDAwKTtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgdGhpcy5fbG9nZ2VyLmVycm9yKCdFcnJvciB3aGlsZSB0cnlpbmcgdG8gYXV0aGVudGljYXRlIHRoZSB1c2VyJywgZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNoZWNrRm9yU2Vzc2lvbkV4cGlyeShmb3JjZSA9IGZhbHNlKSB7XHJcbiAgICBpZiAodGhpcy5fYXV0aE9wdGlvbnM/LmNoZWNrU2Vzc2lvblZhbGlkaXR5SW5TZWNvbmRzICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fYXV0aE9wdGlvbnM/LmNoZWNrU2Vzc2lvblZhbGlkaXR5SW5TZWNvbmRzID4gLTEgJiYgdGhpcy5fc2Vzc2lvbkV4cGlyeUNoZWNrSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLl9zZXNzaW9uRXhwaXJ5Q2hlY2tJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcclxuICAgICAgICB0aGlzLl9zZXNzaW9uRXhwaXJ5Q2hlY2tJZCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCBzdGlsbEF1dGhlbnRpY2F0ZWQgPSBhd2FpdCB0aGlzLmNoZWNrQXV0aCh0aGlzLl9hdXRoT3B0aW9ucy5sb2dpblVybCk7XHJcbiAgICAgICAgaWYgKHN0aWxsQXV0aGVudGljYXRlZCkge1xyXG4gICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oJ1Nlc3Npb24gU3RpbGwgQWN0aXZlJyk7XHJcbiAgICAgICAgICB0aGlzLmNoZWNrRm9yU2Vzc2lvbkV4cGlyeSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLl9sb2dnZXIuaW5mbyhcclxuICAgICAgICAgICAgJ1Nlc3Npb24gbm90IHZhbGlkLiBLaWxsaW5nIHNlc3Npb24gYW5kIG5vdGlmeWluZyByZWdpc3RlcmVkIGNhbGxiYWNrIHRoYXQgYXV0aGVudGljYXRpb24gaXMgcmVxdWlyZWQuIFRoaXMgY2hlY2sgaXMgY29uZmlndXJlZCBpbiB0aGUgZGF0YSBmb3IgdGhpcyBhdXRoIG1vZHVsZS4gU2V0IGNoZWNrU2Vzc2lvblZhbGlkaXR5SW5TZWNvbmRzIHRvIC0xIGluIHRoZSBhdXRoUHJvdmlkZXIgbW9kdWxlIGRlZmluaXRpb24gaWYgeW91IHdpc2ggdG8gZGlzYWJsZSB0aGlzIGNoZWNrJyxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICBjbGVhckN1cnJlbnRVc2VyKCk7XHJcbiAgICAgICAgICBhd2FpdCB0aGlzLm5vdGlmeVN1YnNjcmliZXJzKCdzZXNzaW9uLWV4cGlyZWQnLCB0aGlzLl9zZXNzaW9uRXhwaXJlZFN1YnNjcmliZXJzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sIHRoaXMuX2F1dGhPcHRpb25zLmNoZWNrU2Vzc2lvblZhbGlkaXR5SW5TZWNvbmRzICogMTAwMCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIG5vdGlmeVN1YnNjcmliZXJzKGV2ZW50VHlwZTogc3RyaW5nLCBzdWJzY3JpYmVyczogTWFwPHN0cmluZywgKCkgPT4gUHJvbWlzZTx2b2lkPj4pIHtcclxuICAgIGNvbnN0IHN1YnNjcmliZXJJZHMgPSBBcnJheS5mcm9tKHN1YnNjcmliZXJzLmtleXMoKSk7XHJcbiAgICBzdWJzY3JpYmVySWRzLnJldmVyc2UoKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJJZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc3Qgc3Vic2NyaWJlcklkID0gc3Vic2NyaWJlcklkc1tpXTtcclxuICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oYE5vdGlmeWluZyBzdWJzY3JpYmVyIHdpdGggc3Vic2NyaXB0aW9uIElkOiAke3N1YnNjcmliZXJJZH0gb2YgZXZlbnQgdHlwZTogJHtldmVudFR5cGV9YCk7XHJcbiAgICAgIGF3YWl0IHN1YnNjcmliZXJzLmdldChzdWJzY3JpYmVySWQpKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGhhbmRsZUxvZ291dChyZXNvbHZlOiAoc3VjY2VzczogYm9vbGVhbikgPT4gdm9pZCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKHRoaXMuX2F1dGhlbnRpY2F0ZWQgPT09IHVuZGVmaW5lZCB8fCAhdGhpcy5fYXV0aGVudGljYXRlZCkge1xyXG4gICAgICB0aGlzLl9sb2dnZXIuZXJyb3IoJ1lvdSBoYXZlIHJlcXVlc3RlZCB0byBsb2cgb3V0IGJ1dCBhcmUgbm90IGxvZ2dlZCBpbicpO1xyXG4gICAgICByZXNvbHZlKGZhbHNlKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fbG9nZ2VyLmluZm8oJ0xvZyBvdXQgcmVxdWVzdGVkJyk7XHJcbiAgICBhd2FpdCB0aGlzLm5vdGlmeVN1YnNjcmliZXJzKCdiZWZvcmUtbG9nZ2VkLW91dCcsIHRoaXMuX2JlZm9yZUxvZ2dlZE91dFN1YnNjcmliZXJzKTtcclxuICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcclxuICAgIGNsZWFyQ3VycmVudFVzZXIoKTtcclxuICAgIGlmICh0aGlzLl9hdXRoT3B0aW9ucy5sb2dvdXRVcmwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9hdXRoT3B0aW9ucy5sb2dvdXRVcmwgIT09IG51bGwgJiYgdGhpcy5fYXV0aE9wdGlvbnMubG9nb3V0VXJsLnRyaW0oKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3Qgd2luID0gYXdhaXQgdGhpcy5vcGVuTG9nb3V0V2luZG93KHRoaXMuX2F1dGhPcHRpb25zLmxvZ291dFVybCk7XHJcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICBhd2FpdCB3aW4uY2xvc2UoKTtcclxuICAgICAgICAgIGF3YWl0IHRoaXMubm90aWZ5U3Vic2NyaWJlcnMoJ2xvZ2dlZC1vdXQnLCB0aGlzLl9sb2dnZWRPdXRTdWJzY3JpYmVycyk7XHJcbiAgICAgICAgICByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgIH0sIDIwMDApO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIHRoaXMuX2xvZ2dlci5lcnJvcihgRXJyb3Igd2hpbGUgbGF1bmNoaW5nIGxvZ291dCB3aW5kb3cuICR7ZXJyb3J9YCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2F1dGhlbnRpY2F0aW9uVHlwZScpID09PSAnREFUQUJBU0VfTE9HSU4nICYmIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpKSB7XHJcbiAgICAgIGNvbnN0IHdpbiA9IGF3YWl0IHRoaXMub3BlbkxvZ291dFdpbmRvdyh0aGlzLl9hdXRoT3B0aW9ucy5sb2dvdXRVcmwpO1xyXG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICdodHRwOi8vbG9jYWxob3N0OjgwODIvTG9nb3V0JztcclxuICAgICAgdGhpcy5yZW1vdmVVc2VyKCk7XHJcbiAgICAgIGF3YWl0IHdpbi5jbG9zZSgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXdhaXQgdGhpcy5ub3RpZnlTdWJzY3JpYmVycygnbG9nZ2VkLW91dCcsIHRoaXMuX2xvZ2dlZE91dFN1YnNjcmliZXJzKTtcclxuICAgICAgcmVzb2x2ZSh0cnVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgb3BlbkxvZ2luV2luZG93KHVybDogc3RyaW5nKTogUHJvbWlzZTxPcGVuRmluLldpbmRvdz4ge1xyXG4gICAgY29uc3QgZW5yaWNoZWRDdXN0b21EYXRhID0ge1xyXG4gICAgICBjdXJyZW50VXNlcktleTogRVhBTVBMRV9BVVRIX0NVUlJFTlRfVVNFUl9LRVksXHJcbiAgICAgIC4uLnRoaXMuX2F1dGhPcHRpb25zPy5jdXN0b21EYXRhLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBmaW4uV2luZG93LmNyZWF0ZSh7XHJcbiAgICAgIG5hbWU6ICdhdXRoLWxvZy1pbicsXHJcbiAgICAgIGFsd2F5c09uVG9wOiBmYWxzZSxcclxuICAgICAgbWF4aW1pemFibGU6IGZhbHNlLFxyXG4gICAgICBtaW5pbWl6YWJsZTogdHJ1ZSxcclxuICAgICAgYXV0b1Nob3c6IGZhbHNlLFxyXG4gICAgICBkZWZhdWx0Q2VudGVyZWQ6IHRydWUsXHJcbiAgICAgIGRlZmF1bHRIZWlnaHQ6IHRoaXMuX2F1dGhPcHRpb25zLmxvZ2luSGVpZ2h0ID8/IDYwMCxcclxuICAgICAgZGVmYXVsdFdpZHRoOiB0aGlzLl9hdXRoT3B0aW9ucy5sb2dpbldpZHRoID8/IDUwMCxcclxuICAgICAgaW5jbHVkZUluU25hcHNob3RzOiBmYWxzZSxcclxuICAgICAgcmVzaXphYmxlOiBmYWxzZSxcclxuICAgICAgc2hvd1Rhc2tiYXJJY29uOiB0cnVlLFxyXG4gICAgICBzYXZlV2luZG93U3RhdGU6IGZhbHNlLFxyXG4gICAgICB1cmwsXHJcbiAgICAgIGN1c3RvbURhdGE6IGVucmljaGVkQ3VzdG9tRGF0YSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBvcGVuTG9nb3V0V2luZG93KHVybDogc3RyaW5nKTogUHJvbWlzZTxPcGVuRmluLldpbmRvdz4ge1xyXG4gICAgcmV0dXJuIGZpbi5XaW5kb3cuY3JlYXRlKHtcclxuICAgICAgbmFtZTogJ2F1dGgtbG9nLW91dCcsXHJcbiAgICAgIG1heGltaXphYmxlOiBmYWxzZSxcclxuICAgICAgbWluaW1pemFibGU6IGZhbHNlLFxyXG4gICAgICBhdXRvU2hvdzogZmFsc2UsXHJcbiAgICAgIGRlZmF1bHRDZW50ZXJlZDogdHJ1ZSxcclxuICAgICAgZGVmYXVsdEhlaWdodDogdGhpcy5fYXV0aE9wdGlvbnMubG9naW5IZWlnaHQgPz8gMzIwLFxyXG4gICAgICBkZWZhdWx0V2lkdGg6IHRoaXMuX2F1dGhPcHRpb25zLmxvZ2luV2lkdGggPz8gNDAwLFxyXG4gICAgICBpbmNsdWRlSW5TbmFwc2hvdHM6IGZhbHNlLFxyXG4gICAgICByZXNpemFibGU6IGZhbHNlLFxyXG4gICAgICBzaG93VGFza2Jhckljb246IGZhbHNlLFxyXG4gICAgICBzYXZlV2luZG93U3RhdGU6IGZhbHNlLFxyXG4gICAgICB1cmwsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgY2hlY2tBdXRoKHVybDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBjb25zdCB3aW5kb3dUb0NoZWNrID0gYXdhaXQgZmluLldpbmRvdy5jcmVhdGUoe1xyXG4gICAgICBuYW1lOiAnYXV0aC1jaGVjay13aW5kb3cnLFxyXG4gICAgICBhbHdheXNPblRvcDogdHJ1ZSxcclxuICAgICAgbWF4aW1pemFibGU6IGZhbHNlLFxyXG4gICAgICBtaW5pbWl6YWJsZTogZmFsc2UsXHJcbiAgICAgIGF1dG9TaG93OiBmYWxzZSxcclxuICAgICAgZGVmYXVsdEhlaWdodDogdGhpcy5fYXV0aE9wdGlvbnMubG9naW5IZWlnaHQgPz8gMzI1LFxyXG4gICAgICBkZWZhdWx0V2lkdGg6IHRoaXMuX2F1dGhPcHRpb25zLmxvZ2luV2lkdGggPz8gNDAwLFxyXG4gICAgICBpbmNsdWRlSW5TbmFwc2hvdHM6IGZhbHNlLFxyXG4gICAgICByZXNpemFibGU6IGZhbHNlLFxyXG4gICAgICBzaG93VGFza2Jhckljb246IGZhbHNlLFxyXG4gICAgICBzYXZlV2luZG93U3RhdGU6IGZhbHNlLFxyXG4gICAgICB1cmwsXHJcbiAgICB9KTtcclxuICAgIGxldCBpc0F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCB3aW5kb3dUb0NoZWNrLmdldEluZm8oKTtcclxuICAgICAgaWYgKGluZm8udXJsID09PSB0aGlzLl9hdXRoT3B0aW9ucy5hdXRoZW50aWNhdGVkVXJsKSB7XHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLmVycm9yKCdFcnJvciBlbmNvdW50ZXJlZCB3aGlsZSBjaGVja2luZyBzZXNzaW9uJywgZXJyb3IpO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgaWYgKHdpbmRvd1RvQ2hlY2sgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGF3YWl0IHdpbmRvd1RvQ2hlY2suY2xvc2UodHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpc0F1dGhlbnRpY2F0ZWQ7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB0eXBlIHsgQ3VzdG9tU2V0dGluZ3MsIFBsYXRmb3JtQXBwIH0gZnJvbSAnY3VzdG9taXplLXdvcmtzcGFjZS9zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IEVuZHBvaW50LCBFbmRwb2ludERlZmluaXRpb24sIEZldGNoT3B0aW9ucyB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL2VuZHBvaW50LXNoYXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgTG9nZ2VyLCBMb2dnZXJDcmVhdG9yIH0gZnJvbSAnY3VzdG9taXplLXdvcmtzcGFjZS9zaGFwZXMvbG9nZ2VyLXNoYXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgTW9kdWxlRGVmaW5pdGlvbiwgTW9kdWxlSGVscGVycyB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL21vZHVsZS1zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IEV4YW1wbGVFbmRwb2ludE9wdGlvbnMsIEV4YW1wbGVVc2VyUm9sZU1hcHBpbmcgfSBmcm9tICcuL3NoYXBlcyc7XHJcbmltcG9ydCB7IGdldEN1cnJlbnRVc2VyIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmV4cG9ydCBjbGFzcyBFeGFtcGxlQXV0aEVuZHBvaW50IGltcGxlbWVudHMgRW5kcG9pbnQ8RXhhbXBsZUVuZHBvaW50T3B0aW9ucz4ge1xyXG4gIHByaXZhdGUgX2RlZmluaXRpb246IE1vZHVsZURlZmluaXRpb248RXhhbXBsZUVuZHBvaW50T3B0aW9ucz47XHJcblxyXG4gIHByaXZhdGUgX2xvZ2dlcjogTG9nZ2VyO1xyXG5cclxuICBwcml2YXRlIF9yb2xlTWFwcGluZzogeyBba2V5OiBzdHJpbmddOiBFeGFtcGxlVXNlclJvbGVNYXBwaW5nIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpc2UgdGhlIG1vZHVsZS5cclxuICAgKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgbW9kdWxlIGZyb20gY29uZmlndXJhdGlvbiBpbmNsdWRlIGN1c3RvbSBvcHRpb25zLlxyXG4gICAqIEBwYXJhbSBsb2dnZXJDcmVhdG9yIEZvciBsb2dnaW5nIGVudHJpZXMuXHJcbiAgICogQHBhcmFtIGhlbHBlcnMgSGVscGVyIG1ldGhvZHMgZm9yIHRoZSBtb2R1bGUgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgYXBwbGljYXRpb24gY29yZS5cclxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBpbml0aWFsaXplKGRlZmluaXRpb246IE1vZHVsZURlZmluaXRpb248RXhhbXBsZUVuZHBvaW50T3B0aW9ucz4sIGNyZWF0ZUxvZ2dlcjogTG9nZ2VyQ3JlYXRvciwgaGVscGVycz86IE1vZHVsZUhlbHBlcnMpIHtcclxuICAgIHRoaXMuX2xvZ2dlciA9IGNyZWF0ZUxvZ2dlcignRXhhbXBsZUF1dGhFbmRwb2ludCcpO1xyXG4gICAgdGhpcy5fbG9nZ2VyLmluZm8oJ1dhcyBwYXNzZWQgdGhlIGZvbGxvd2luZyBvcHRpb25zJywgZGVmaW5pdGlvbi5kYXRhKTtcclxuICAgIHRoaXMuX3JvbGVNYXBwaW5nID0gZGVmaW5pdGlvbj8uZGF0YT8ucm9sZU1hcHBpbmc7XHJcbiAgICB0aGlzLl9kZWZpbml0aW9uID0gZGVmaW5pdGlvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBhIHJlcXVlc3QgcmVzcG9uc2Ugb24gYW4gZW5kcG9pbnQuXHJcbiAgICogQHBhcmFtIGVuZHBvaW50RGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZW5kcG9pbnQuXHJcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIHJlcXVlc3QgdG8gcHJvY2Vzcy5cclxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UgdG8gdGhlIHJlcXVlc3QsIG9yIG51bGwgb2Ygbm90IGhhbmRsZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGFzeW5jIHJlcXVlc3RSZXNwb25zZShlbmRwb2ludERlZmluaXRpb246IEVuZHBvaW50RGVmaW5pdGlvbjxGZXRjaE9wdGlvbnM+LCByZXF1ZXN0PzogdW5rbm93bik6IFByb21pc2U8dW5rbm93bj4ge1xyXG4gICAgaWYgKGVuZHBvaW50RGVmaW5pdGlvbi50eXBlICE9PSAnbW9kdWxlJykge1xyXG4gICAgICB0aGlzLl9sb2dnZXIud2FybihgV2Ugb25seSBleHBlY3QgZW5kcG9pbnRzIG9mIHR5cGUgbW9kdWxlLiBVbmFibGUgdG8gYWN0aW9uIHJlcXVlc3QvcmVzcG9uc2UgZm9yOiAke2VuZHBvaW50RGVmaW5pdGlvbi5pZH1gKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fbG9nZ2VyICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oXHJcbiAgICAgICAgJ1RoaXMgYXV0aCBlbmRwb2ludCBtb2R1bGUgaXMgYW4gZXhhbXBsZSB0aGF0IHRoYXQgc2ltdWxhdGVzIHJlcXVlc3RpbmcgYSBodHRwIGVuZHBvaW50IGFuZCBtYW5pcHVsYXRpbmcgaXQgYmFzZWQgb24gdGhlIGN1cnJlbnQgZXhhbXBsZSB1c2VyIGFzIGlmIGl0IHdhcyB0aGUgc2VydmVyIGRvaW5nIHRoZSBtYW5pcHVsYXRpb24uIERPIE5PVCBVU0UgVEhJUyBNT0RVTEUgSU4gUFJPRFVDVElPTi4nLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgdXJsLCAuLi5vcHRpb25zIH06IEZldGNoT3B0aW9ucyA9IGVuZHBvaW50RGVmaW5pdGlvbi5vcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IHJlcSA9IHRoaXMuZ2V0UmVxdWVzdE9wdGlvbnModXJsIGFzIHN0cmluZywgb3B0aW9ucywgcmVxdWVzdCk7XHJcbiAgICBpZiAocmVxLm9wdGlvbnMubWV0aG9kICE9PSAnR0VUJyAmJiByZXEub3B0aW9ucy5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgICB0aGlzLl9sb2dnZXIud2FybihgJHtlbmRwb2ludERlZmluaXRpb24uaWR9IHNwZWNpZmllcyBhIHR5cGU6ICR7ZW5kcG9pbnREZWZpbml0aW9uLnR5cGV9IHdpdGggYSBtZXRob2QgJHtyZXEub3B0aW9ucy5tZXRob2R9IHRoYXQgaXMgbm90IHN1cHBvcnRlZC5gKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChyZXEudXJsLCByZXEub3B0aW9ucyBhcyBSZXF1ZXN0SW5pdCk7XHJcblxyXG4gICAgaWYgKHJlc3BvbnNlLm9rKSB7XHJcbiAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGpzb24pKSB7XHJcbiAgICAgICAgLy8gcmV0dXJuZWQgYXBwc1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFwcGx5Q3VycmVudFVzZXJUb0FwcHMoanNvbikgYXMgdW5rbm93bjtcclxuICAgICAgfVxyXG4gICAgICAvLyBzZXR0aW5nc1xyXG4gICAgICByZXR1cm4gdGhpcy5hcHBseUN1cnJlbnRVc2VyVG9TZXR0aW5ncyhqc29uKSBhcyB1bmtub3duO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldFJlcXVlc3RPcHRpb25zKHVybDogc3RyaW5nLCBvcHRpb25zOiBGZXRjaE9wdGlvbnMsIHJlcXVlc3Q6IHVua25vd24pOiB7IHVybDogc3RyaW5nOyBvcHRpb25zOiBGZXRjaE9wdGlvbnMgfSB7XHJcbiAgICBpZiAob3B0aW9ucy5tZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICAgIGlmIChyZXF1ZXN0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocmVxdWVzdCk7XHJcbiAgICAgICAgaWYgKGtleXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgY29uc3QgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHVybCA9IHVybC5yZXBsYWNlKGBbJHtrZXlzW2ldfV1gLCBlbmNvZGVVUklDb21wb25lbnQocmVxdWVzdFtrZXlzW2ldXSBhcyBzdHJpbmcpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5tZXRob2QgPT09ICdQT1NUJyAmJiByZXF1ZXN0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgb3B0aW9ucy5ib2R5ID0gSlNPTi5zdHJpbmdpZnkocmVxdWVzdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHsgdXJsLCBvcHRpb25zIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFwcGx5Q3VycmVudFVzZXJUb0FwcHMoYXBwczogUGxhdGZvcm1BcHBbXSA9IFtdKTogUGxhdGZvcm1BcHBbXSB7XHJcbiAgICBjb25zdCBjdXJyZW50VXNlciA9IGdldEN1cnJlbnRVc2VyKCk7XHJcbiAgICBpZiAoXHJcbiAgICAgIGN1cnJlbnRVc2VyID09PSBudWxsIHx8XHJcbiAgICAgIHRoaXMuX3JvbGVNYXBwaW5nID09PSB1bmRlZmluZWQgfHxcclxuICAgICAgdGhpcy5fcm9sZU1hcHBpbmdbY3VycmVudFVzZXIucm9sZV0gPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICB0aGlzLl9yb2xlTWFwcGluZ1tjdXJyZW50VXNlci5yb2xlXS5leGNsdWRlQXBwc1dpdGhUYWcgPT09IHVuZGVmaW5lZFxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBhcHBzO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZXhjbHVkZVRhZyA9IHRoaXMuX3JvbGVNYXBwaW5nW2N1cnJlbnRVc2VyLnJvbGVdLmV4Y2x1ZGVBcHBzV2l0aFRhZztcclxuICAgIGNvbnN0IGZpbHRlcmVkQXBwczogUGxhdGZvcm1BcHBbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcHBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGFwcHNbaV0udGFncykpIHtcclxuICAgICAgICBsZXQgaW5jbHVkZSA9IHRydWU7XHJcbiAgICAgICAgZm9yIChsZXQgdCA9IDA7IHQgPCBhcHBzW2ldLnRhZ3MubGVuZ3RoOyB0KyspIHtcclxuICAgICAgICAgIGNvbnN0IHRhZzogc3RyaW5nID0gYXBwc1tpXS50YWdzW3RdO1xyXG4gICAgICAgICAgaWYgKGV4Y2x1ZGVUYWcuaW5jbHVkZXModGFnKSkge1xyXG4gICAgICAgICAgICBpbmNsdWRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaW5jbHVkZSkge1xyXG4gICAgICAgICAgZmlsdGVyZWRBcHBzLnB1c2goYXBwc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZpbHRlcmVkQXBwcy5wdXNoKGFwcHNbaV0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmlsdGVyZWRBcHBzO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseUN1cnJlbnRVc2VyVG9TZXR0aW5ncyhzZXR0aW5nczogQ3VzdG9tU2V0dGluZ3MpOiBDdXN0b21TZXR0aW5ncyB7XHJcbiAgICBjb25zdCBjdXJyZW50VXNlciA9IGdldEN1cnJlbnRVc2VyKCk7XHJcbiAgICBpZiAoY3VycmVudFVzZXIgPT09IG51bGwgfHwgdGhpcy5fcm9sZU1hcHBpbmcgPT09IHVuZGVmaW5lZCB8fCB0aGlzLl9yb2xlTWFwcGluZ1tjdXJyZW50VXNlci5yb2xlXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBzZXR0aW5ncztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShzZXR0aW5ncz8uZW5kcG9pbnRQcm92aWRlcj8ubW9kdWxlcykpIHtcclxuICAgICAgc2V0dGluZ3MuZW5kcG9pbnRQcm92aWRlci5tb2R1bGVzLnB1c2goe1xyXG4gICAgICAgIGRhdGE6IHRoaXMuX2RlZmluaXRpb24sXHJcbiAgICAgICAgZW5hYmxlZDogdGhpcy5fZGVmaW5pdGlvbi5lbmFibGVkLFxyXG4gICAgICAgIGlkOiB0aGlzLl9kZWZpbml0aW9uLmlkLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiB0aGlzLl9kZWZpbml0aW9uLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgIGljb246IHRoaXMuX2RlZmluaXRpb24uaWNvbixcclxuICAgICAgICBpbmZvOiB0aGlzLl9kZWZpbml0aW9uLmluZm8sXHJcbiAgICAgICAgdGl0bGU6IHRoaXMuX2RlZmluaXRpb24udGl0bGUsXHJcbiAgICAgICAgdXJsOiB0aGlzLl9kZWZpbml0aW9uLnVybCxcclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHNldHRpbmdzPy5lbmRwb2ludFByb3ZpZGVyPy5lbmRwb2ludHMpICYmIEFycmF5LmlzQXJyYXkoc2V0dGluZ3M/LmFwcFByb3ZpZGVyPy5lbmRwb2ludElkcykpIHtcclxuICAgICAgICBjb25zdCBhcHBFbmRwb2ludHMgPSBzZXR0aW5ncz8uYXBwUHJvdmlkZXI/LmVuZHBvaW50SWRzO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXBwRW5kcG9pbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAodHlwZW9mIGFwcEVuZHBvaW50c1tpXSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgY29uc3QgZW5kcG9pbnRUb1VwZGF0ZSA9IHNldHRpbmdzLmVuZHBvaW50UHJvdmlkZXIuZW5kcG9pbnRzLmZpbmQoKGVuZHBvaW50RW50cnkpID0+IGVuZHBvaW50RW50cnkuaWQgPT09IGFwcEVuZHBvaW50c1tpXSAmJiBlbmRwb2ludEVudHJ5LnR5cGUgPT09ICdmZXRjaCcpO1xyXG4gICAgICAgICAgICBpZiAoZW5kcG9pbnRUb1VwZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgZW5kcG9pbnRUb1VwZGF0ZS50eXBlID0gJ21vZHVsZSc7XHJcbiAgICAgICAgICAgICAgLy8gdGhpcyBpZiBjb25kaXRpb24gY2hlY2sgaXMgaGVyZSB0byBtYWtlIHR5cGVzY3JpcHQgaGFwcHkgd2l0aCB0aGUgZW5kcG9pbnQgc28gdGhhdCB0eXBlSWQgY2FuIGJlIHNldFxyXG4gICAgICAgICAgICAgIGlmIChlbmRwb2ludFRvVXBkYXRlLnR5cGUgPT09ICdtb2R1bGUnKSB7XHJcbiAgICAgICAgICAgICAgICBlbmRwb2ludFRvVXBkYXRlLnR5cGVJZCA9IHRoaXMuX2RlZmluaXRpb24uaWQ7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2V0dGluZ3M/LnRoZW1lUHJvdmlkZXI/LnRoZW1lcykgJiYgc2V0dGluZ3MudGhlbWVQcm92aWRlci50aGVtZXMubGVuZ3RoID4gMCAmJiB0aGlzLl9yb2xlTWFwcGluZ1tjdXJyZW50VXNlci5yb2xlXS5wcmVmZXJyZWRTY2hlbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBzZXR0aW5ncy50aGVtZVByb3ZpZGVyLnRoZW1lc1swXS5kZWZhdWx0ID0gdGhpcy5fcm9sZU1hcHBpbmdbY3VycmVudFVzZXIucm9sZV0ucHJlZmVycmVkU2NoZW1lID09PSAnZGFyaycgPyAnZGFyaycgOiAnbGlnaHQnO1xyXG4gICAgICBjb25zdCBzdG9yZWRTY2hlbWVQcmVmZXJlbmNlID0gYCR7ZmluLm1lLmlkZW50aXR5LnV1aWR9LVNlbGVjdGVkQ29sb3JTY2hlbWVgO1xyXG4gICAgICB0aGlzLl9sb2dnZXIud2FybihcclxuICAgICAgICBcIlRoaXMgaXMgYSBkZW1vIG1vZHVsZSB3aGVyZSB3ZSBhcmUgY2xlYXJpbmcgdGhlIGxvY2FsbHkgc3RvcmVkIHNjaGVtZSBwcmVmZXJlbmNlIGluIG9yZGVyIHRvIHNob3cgZGlmZmVyZW50IHNjaGVtZSdzIGxpZ2h0L2RhcmsgYmFzZWQgb24gdXNlciBzZWxlY3Rpb24uIFRoaXMgbWVhbnMgdGhhdCBpdCB3aWxsIGFsd2F5cyBiZSBzZXQgdG8gd2hhdCBpcyBpbiB0aGUgcm9sZSBtYXBwaW5nIGluaXRpYWxseSBhbmQgbm90IHdoYXQgaXQgaXMgc2V0IHRvIGxvY2FsbHkgb24gcmVzdGFydC5cIixcclxuICAgICAgKTtcclxuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oc3RvcmVkU2NoZW1lUHJlZmVyZW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZXhjbHVkZU1lbnVBY3Rpb25JZHMgPSB0aGlzLl9yb2xlTWFwcGluZ1tjdXJyZW50VXNlci5yb2xlXS5leGNsdWRlTWVudUFjdGlvbjtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleGNsdWRlTWVudUFjdGlvbklkcykpIHtcclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2V0dGluZ3M/LmJyb3dzZXJQcm92aWRlcj8uZ2xvYmFsTWVudSkgJiYgc2V0dGluZ3MuYnJvd3NlclByb3ZpZGVyLmdsb2JhbE1lbnUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2V0dGluZ3MuYnJvd3NlclByb3ZpZGVyLmdsb2JhbE1lbnUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGNvbnN0IGdsb2JhbE1lbnVBY3Rpb25JZDogc3RyaW5nID0gc2V0dGluZ3MuYnJvd3NlclByb3ZpZGVyLmdsb2JhbE1lbnVbaV0/LmRhdGE/LmFjdGlvbj8uaWQ7XHJcbiAgICAgICAgICBpZiAoZXhjbHVkZU1lbnVBY3Rpb25JZHMuaW5jbHVkZXMoZ2xvYmFsTWVudUFjdGlvbklkKSkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5icm93c2VyUHJvdmlkZXIuZ2xvYmFsTWVudVtpXS5pbmNsdWRlID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShzZXR0aW5ncz8uYnJvd3NlclByb3ZpZGVyPy5wYWdlTWVudSkgJiYgc2V0dGluZ3MuYnJvd3NlclByb3ZpZGVyLnBhZ2VNZW51Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci5wYWdlTWVudS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgY29uc3QgcGFnZU1lbnVBY3Rpb25JZDogc3RyaW5nID0gc2V0dGluZ3MuYnJvd3NlclByb3ZpZGVyLnBhZ2VNZW51W2ldPy5kYXRhPy5hY3Rpb24/LmlkO1xyXG4gICAgICAgICAgaWYgKGV4Y2x1ZGVNZW51QWN0aW9uSWRzLmluY2x1ZGVzKHBhZ2VNZW51QWN0aW9uSWQpKSB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci5wYWdlTWVudVtpXS5pbmNsdWRlID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShzZXR0aW5ncz8uYnJvd3NlclByb3ZpZGVyPy52aWV3TWVudSkgJiYgc2V0dGluZ3MuYnJvd3NlclByb3ZpZGVyLnZpZXdNZW51Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci52aWV3TWVudS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgY29uc3Qgdmlld01lbnVBY3Rpb25JZDogc3RyaW5nID0gc2V0dGluZ3MuYnJvd3NlclByb3ZpZGVyLnZpZXdNZW51W2ldPy5kYXRhPy5hY3Rpb24/LmlkO1xyXG4gICAgICAgICAgaWYgKGV4Y2x1ZGVNZW51QWN0aW9uSWRzLmluY2x1ZGVzKHZpZXdNZW51QWN0aW9uSWQpKSB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci52aWV3TWVudVtpXS5pbmNsdWRlID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNldHRpbmdzO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgdHlwZSB7IEV4YW1wbGVVc2VyIH0gZnJvbSBcIi4vc2hhcGVzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgRVhBTVBMRV9BVVRIX0NVUlJFTlRfVVNFUl9LRVkgPSBgJHtmaW4ubWUuaWRlbnRpdHkudXVpZH0tRVhBTVBMRV9BVVRIX0NVUlJFTlRfVVNFUmA7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFVzZXIoKTogRXhhbXBsZVVzZXIgfCBudWxsIHtcclxuXHRjb25zdCBzdG9yZWRVc2VyID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oRVhBTVBMRV9BVVRIX0NVUlJFTlRfVVNFUl9LRVkpO1xyXG5cdGlmIChzdG9yZWRVc2VyID09PSBudWxsKSB7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcblx0cmV0dXJuIEpTT04ucGFyc2Uoc3RvcmVkVXNlcikgYXMgRXhhbXBsZVVzZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50VXNlcih1c2VyOiBFeGFtcGxlVXNlcik6IHZvaWQge1xyXG5cdGxvY2FsU3RvcmFnZS5zZXRJdGVtKEVYQU1QTEVfQVVUSF9DVVJSRU5UX1VTRVJfS0VZLCBKU09OLnN0cmluZ2lmeSh1c2VyKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhckN1cnJlbnRVc2VyKCkge1xyXG5cdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKEVYQU1QTEVfQVVUSF9DVVJSRU5UX1VTRVJfS0VZKTtcclxufVxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB0eXBlIHsgTW9kdWxlSW1wbGVtZW50YXRpb24sIE1vZHVsZVR5cGVzIH0gZnJvbSAnY3VzdG9taXplLXdvcmtzcGFjZS9zaGFwZXMvbW9kdWxlLXNoYXBlcyc7XHJcbmltcG9ydCB7IEV4YW1wbGVBdXRoUHJvdmlkZXIgfSBmcm9tICcuL2F1dGgtcHJvdmlkZXInO1xyXG5pbXBvcnQgeyBFeGFtcGxlQXV0aEVuZHBvaW50IH0gZnJvbSAnLi9lbmRwb2ludCc7XHJcblxyXG5leHBvcnQgY29uc3QgZW50cnlQb2ludHM6IHsgW3R5cGUgaW4gTW9kdWxlVHlwZXNdPzogTW9kdWxlSW1wbGVtZW50YXRpb24gfSA9IHtcclxuICBhdXRoOiBuZXcgRXhhbXBsZUF1dGhQcm92aWRlcigpLFxyXG4gIGVuZHBvaW50OiBuZXcgRXhhbXBsZUF1dGhFbmRwb2ludCgpLFxyXG59O1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=