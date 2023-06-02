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

/***/ "./client/src/modules/auth/login/auth-provider.ts":
/*!********************************************************!*\
  !*** ./client/src/modules/auth/login/auth-provider.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ExampleAuthProvider": () => (/* binding */ ExampleAuthProvider)
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
                            // axios
                            //   .post('http://localhost:8083/AuthenticateUser/InitializeData', {}, { timeout: 120000 })
                            //   .then((response) => {
                            //     var result = JSON.parse(response.data);
                            //   })
                            //   .catch((error) => {
                            //     console.log(error);
                            //   });
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
/* harmony export */   "ExampleAuthEndpoint": () => (/* binding */ ExampleAuthEndpoint)
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
/* harmony export */   "EXAMPLE_AUTH_CURRENT_USER_KEY": () => (/* binding */ EXAMPLE_AUTH_CURRENT_USER_KEY),
/* harmony export */   "clearCurrentUser": () => (/* binding */ clearCurrentUser),
/* harmony export */   "getCurrentUser": () => (/* binding */ getCurrentUser),
/* harmony export */   "setCurrentUser": () => (/* binding */ setCurrentUser)
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
/* harmony export */   "entryPoints": () => (/* binding */ entryPoints)
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0FBQyxJQUFpQjtJQUMvQyxZQUFZLENBQUMsT0FBTyxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzRSxDQUFDO0FBRU0sU0FBUyxnQkFBZ0I7SUFDL0IsWUFBWSxDQUFDLFVBQVUsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQ3hELENBQUM7Ozs7Ozs7U0NsQkQ7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTs7U0FFQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTs7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0E7VUFDQSx5Q0FBeUMsd0NBQXdDO1VBQ2pGO1VBQ0E7VUFDQTs7Ozs7VUNQQTs7Ozs7VUNBQTtVQUNBO1VBQ0E7VUFDQSx1REFBdUQsaUJBQWlCO1VBQ3hFO1VBQ0EsZ0RBQWdELGFBQWE7VUFDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7QUNMc0Q7QUFDTDtBQUUxQyxNQUFNLFdBQVcsR0FBcUQ7SUFDM0UsSUFBSSxFQUFFLElBQUksK0RBQW1CLEVBQUU7SUFDL0IsUUFBUSxFQUFFLElBQUksMERBQW1CLEVBQUU7Q0FDcEMsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL25pcnZhbmFvcGVuZmluLXdvcmtzcGFjZS8uL2NsaWVudC9zcmMvZnJhbWV3b3JrL3V1aWQudHMiLCJ3ZWJwYWNrOi8vbmlydmFuYW9wZW5maW4td29ya3NwYWNlLy4vY2xpZW50L3NyYy9tb2R1bGVzL2F1dGgvbG9naW4vYXV0aC1wcm92aWRlci50cyIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2UvLi9jbGllbnQvc3JjL21vZHVsZXMvYXV0aC9sb2dpbi9lbmRwb2ludC50cyIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2UvLi9jbGllbnQvc3JjL21vZHVsZXMvYXV0aC9sb2dpbi91dGlsLnRzIiwid2VicGFjazovL25pcnZhbmFvcGVuZmluLXdvcmtzcGFjZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9uaXJ2YW5hb3BlbmZpbi13b3Jrc3BhY2Uvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL25pcnZhbmFvcGVuZmluLXdvcmtzcGFjZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL25pcnZhbmFvcGVuZmluLXdvcmtzcGFjZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL25pcnZhbmFvcGVuZmluLXdvcmtzcGFjZS8uL2NsaWVudC9zcmMvbW9kdWxlcy9hdXRoL2xvZ2luL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiByYW5kb21VVUlEKCk6IHN0cmluZyB7XHJcblx0aWYgKFwicmFuZG9tVVVJRFwiIGluIHdpbmRvdy5jcnlwdG8pIHtcclxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxyXG5cdFx0cmV0dXJuIHdpbmRvdy5jcnlwdG8ucmFuZG9tVVVJRCgpO1xyXG5cdH1cclxuXHQvLyBQb2x5ZmlsbCB0aGUgd2luZG93LmNyeXB0by5yYW5kb21VVUlEIGlmIHdlIGFyZSBydW5uaW5nIGluIGEgbm9uIHNlY3VyZSBjb250ZXh0IHRoYXQgZG9lc24ndCBoYXZlIGl0XHJcblx0Ly8gd2UgYXJlIHN0aWxsIHVzaW5nIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzIHdoaWNoIGlzIGFsd2F5cyBhdmFpbGFibGVcclxuXHQvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjExNzUyMy8yODAwMjE4XHJcblx0Y29uc3QgZ2V0UmFuZG9tSGV4ID0gKGMpID0+XHJcblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYml0d2lzZSwgbm8tbWl4ZWQtb3BlcmF0b3JzXHJcblx0XHQoYyBeICh3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheSgxKSlbMF0gJiAoMTUgPj4gKGMgLyA0KSkpKS50b1N0cmluZygxNik7XHJcblx0cmV0dXJuIFwiMTAwMDAwMDAtMTAwMC00MDAwLTgwMDAtMTAwMDAwMDAwMDAwXCIucmVwbGFjZSgvWzAxOF0vZywgZ2V0UmFuZG9tSGV4KTtcclxufVxyXG4iLCJpbXBvcnQgdHlwZSB7IEF1dGhQcm92aWRlciB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL2F1dGgtc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBMb2dnZXIsIExvZ2dlckNyZWF0b3IgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy9sb2dnZXItc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBNb2R1bGVEZWZpbml0aW9uLCBNb2R1bGVIZWxwZXJzIH0gZnJvbSAnY3VzdG9taXplLXdvcmtzcGFjZS9zaGFwZXMvbW9kdWxlLXNoYXBlcyc7XHJcbmltcG9ydCB7IHJhbmRvbVVVSUQgfSBmcm9tICcuLi8uLi8uLi9mcmFtZXdvcmsvdXVpZCc7XHJcbmltcG9ydCB0eXBlIHsgRXhhbXBsZU9wdGlvbnMsIEV4YW1wbGVVc2VyIH0gZnJvbSAnLi9zaGFwZXMnO1xyXG5pbXBvcnQgeyBjbGVhckN1cnJlbnRVc2VyLCBFWEFNUExFX0FVVEhfQ1VSUkVOVF9VU0VSX0tFWSwgZ2V0Q3VycmVudFVzZXIgfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEV4YW1wbGVBdXRoUHJvdmlkZXIgaW1wbGVtZW50cyBBdXRoUHJvdmlkZXI8RXhhbXBsZU9wdGlvbnM+IHtcclxuICBwcml2YXRlIF9hdXRoT3B0aW9uczogRXhhbXBsZU9wdGlvbnM7XHJcblxyXG4gIHByaXZhdGUgX2xvZ2dlcjogTG9nZ2VyO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9zdWJzY3JpYmVJZE1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfbG9nZ2VkSW5TdWJzY3JpYmVyczogTWFwPHN0cmluZywgKCkgPT4gUHJvbWlzZTx2b2lkPj47XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2JlZm9yZUxvZ2dlZE91dFN1YnNjcmliZXJzOiBNYXA8c3RyaW5nLCAoKSA9PiBQcm9taXNlPHZvaWQ+PjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfbG9nZ2VkT3V0U3Vic2NyaWJlcnM6IE1hcDxzdHJpbmcsICgpID0+IFByb21pc2U8dm9pZD4+O1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9zZXNzaW9uRXhwaXJlZFN1YnNjcmliZXJzOiBNYXA8c3RyaW5nLCAoKSA9PiBQcm9taXNlPHZvaWQ+PjtcclxuXHJcbiAgcHJpdmF0ZSBfY3VycmVudFVzZXI6IEV4YW1wbGVVc2VyO1xyXG5cclxuICBwcml2YXRlIF9hdXRoZW50aWNhdGVkOiBib29sZWFuO1xyXG5cclxuICBwcml2YXRlIF9zZXNzaW9uRXhwaXJ5Q2hlY2tJZDogbnVtYmVyO1xyXG5cclxuICByZW1vdmVVc2VyID0gKCkgPT4ge1xyXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XHJcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnY29tcGFueVVzZXJJZCcpO1xyXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2F1dGhlbnRpY2F0aW9uVHlwZScpO1xyXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2lzT3BlbmZpbkF1dGhlbnRpY2F0ZWQnKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgRXhhbXBsZUF1dGhQcm92aWRlci5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuX3N1YnNjcmliZUlkTWFwID0ge307XHJcbiAgICB0aGlzLl9sb2dnZWRJblN1YnNjcmliZXJzID0gbmV3IE1hcCgpO1xyXG4gICAgdGhpcy5fYmVmb3JlTG9nZ2VkT3V0U3Vic2NyaWJlcnMgPSBuZXcgTWFwKCk7XHJcbiAgICB0aGlzLl9sb2dnZWRPdXRTdWJzY3JpYmVycyA9IG5ldyBNYXAoKTtcclxuICAgIHRoaXMuX3Nlc3Npb25FeHBpcmVkU3Vic2NyaWJlcnMgPSBuZXcgTWFwKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXNlIHRoZSBtb2R1bGUuXHJcbiAgICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gb2YgdGhlIG1vZHVsZSBmcm9tIGNvbmZpZ3VyYXRpb24gaW5jbHVkZSBjdXN0b20gb3B0aW9ucy5cclxuICAgKiBAcGFyYW0gbG9nZ2VyQ3JlYXRvciBGb3IgbG9nZ2luZyBlbnRyaWVzLlxyXG4gICAqIEBwYXJhbSBoZWxwZXJzIEhlbHBlciBtZXRob2RzIGZvciB0aGUgbW9kdWxlIHRvIGludGVyYWN0IHdpdGggdGhlIGFwcGxpY2F0aW9uIGNvcmUuXHJcbiAgICogQHJldHVybnMgTm90aGluZy5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgaW5pdGlhbGl6ZShkZWZpbml0aW9uOiBNb2R1bGVEZWZpbml0aW9uPEV4YW1wbGVPcHRpb25zPiwgY3JlYXRlTG9nZ2VyOiBMb2dnZXJDcmVhdG9yLCBoZWxwZXJzOiBNb2R1bGVIZWxwZXJzKSB7XHJcbiAgICB0aGlzLl9sb2dnZXIgPSBjcmVhdGVMb2dnZXIoJ0F1dGhPcGVuZmluLU5pcnZhbmFjZCcpO1xyXG5cclxuICAgIGlmICh0aGlzLl9hdXRoT3B0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKGBTZXR0aW5nIG9wdGlvbnM6ICR7SlNPTi5zdHJpbmdpZnkoZGVmaW5pdGlvbi5kYXRhLCBudWxsLCA0KX1gKTtcclxuICAgICAgdGhpcy5fYXV0aE9wdGlvbnMgPSBkZWZpbml0aW9uLmRhdGE7XHJcbiAgICAgIGlmICh0aGlzLl9hdXRoZW50aWNhdGVkKSB7XHJcbiAgICAgICAgdGhpcy5fY3VycmVudFVzZXIgPSBnZXRDdXJyZW50VXNlcigpO1xyXG4gICAgICAgIHRoaXMuY2hlY2tGb3JTZXNzaW9uRXhwaXJ5KCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci53YXJuKCdPcHRpb25zIGhhdmUgYWxyZWFkeSBiZWVuIHNldCBhcyBpbml0IGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkJyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdWJzY3JpYmUgdG8gb25lIG9mIHRoZSBhdXRoIGV2ZW50cy5cclxuICAgKiBAcGFyYW0gdG8gVGhlIGV2ZW50IHRvIHN1YnNjcmliZSB0by5cclxuICAgKiBAcGFyYW0gY2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIGZpcmUgd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxyXG4gICAqIEByZXR1cm5zIFN1YnNjcmlwdGlvbiBpZCBmb3IgdW5zdWJzY3JpYmluZyBvciB1bmRlZmluZWQgaWYgZXZlbnQgdHlwZSBpcyBub3QgYXZhaWxhYmxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdWJzY3JpYmUodG86ICdsb2dnZWQtaW4nIHwgJ2JlZm9yZS1sb2dnZWQtb3V0JyB8ICdsb2dnZWQtb3V0JyB8ICdzZXNzaW9uLWV4cGlyZWQnLCBjYWxsYmFjazogKCkgPT4gUHJvbWlzZTx2b2lkPik6IHN0cmluZyB7XHJcbiAgICBjb25zdCBrZXkgPSByYW5kb21VVUlEKCk7XHJcbiAgICBsZXQgbWF0Y2hGb3VuZCA9IGZhbHNlO1xyXG4gICAgc3dpdGNoICh0bykge1xyXG4gICAgICBjYXNlICdsb2dnZWQtaW4nOiB7XHJcbiAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VkSW5TdWJzY3JpYmVycy5zZXQoa2V5LCBjYWxsYmFjayk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnYmVmb3JlLWxvZ2dlZC1vdXQnOiB7XHJcbiAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fYmVmb3JlTG9nZ2VkT3V0U3Vic2NyaWJlcnMuc2V0KGtleSwgY2FsbGJhY2spO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ2xvZ2dlZC1vdXQnOiB7XHJcbiAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VkT3V0U3Vic2NyaWJlcnMuc2V0KGtleSwgY2FsbGJhY2spO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ3Nlc3Npb24tZXhwaXJlZCc6IHtcclxuICAgICAgICBtYXRjaEZvdW5kID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9zZXNzaW9uRXhwaXJlZFN1YnNjcmliZXJzLnNldChrZXksIGNhbGxiYWNrKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChtYXRjaEZvdW5kKSB7XHJcbiAgICAgIHRoaXMuX3N1YnNjcmliZUlkTWFwW2tleV0gPSB0bztcclxuICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oYFN1YnNjcmlwdGlvbiB0byAke3RvfSBldmVudHMgcmVnaXN0ZXJlZC4gU3Vic2NyaXB0aW9uIElkOiAke2tleX1gKTtcclxuICAgICAgcmV0dXJuIGtleTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVW5zdWJzY3JpYmUgZnJvbSBhbiBhbHJlYWR5IHN1YnNjcmliZWQgZXZlbnQuXHJcbiAgICogQHBhcmFtIHN1YnNjcmlwdGlvbklkIFRoZSBpZCBvZiB0aGUgc3Vic2NyaXB0aW9uIHJldHVybmVkIGZyb20gc3Vic2NyaWJlLlxyXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHVuc3Vic2NyaWJlIHdhcyBzdWNjZXNzZnVsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB1bnN1YnNjcmliZShmcm9tOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIGxldCBtYXRjaEZvdW5kID0gZmFsc2U7XHJcbiAgICBjb25zdCBldmVudFR5cGUgPSB0aGlzLl9zdWJzY3JpYmVJZE1hcFtmcm9tXTtcclxuICAgIGlmIChldmVudFR5cGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLl9sb2dnZXIud2FybihgWW91IGhhdmUgdHJpZWQgdG8gdW5zdWJzY3JpYmUgd2l0aCBhIGtleSAke2Zyb219IHRoYXQgaXMgaW52YWxpZGApO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgc3dpdGNoIChldmVudFR5cGUpIHtcclxuICAgICAgY2FzZSAnbG9nZ2VkLWluJzoge1xyXG4gICAgICAgIG1hdGNoRm91bmQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX2xvZ2dlZEluU3Vic2NyaWJlcnMuZGVsZXRlKGZyb20pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ2JlZm9yZS1sb2dnZWQtb3V0Jzoge1xyXG4gICAgICAgIG1hdGNoRm91bmQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX2JlZm9yZUxvZ2dlZE91dFN1YnNjcmliZXJzLmRlbGV0ZShmcm9tKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICBjYXNlICdsb2dnZWQtb3V0Jzoge1xyXG4gICAgICAgIG1hdGNoRm91bmQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX2xvZ2dlZE91dFN1YnNjcmliZXJzLmRlbGV0ZShmcm9tKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICBjYXNlICdzZXNzaW9uLWV4cGlyZWQnOiB7XHJcbiAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fc2Vzc2lvbkV4cGlyZWRTdWJzY3JpYmVycy5kZWxldGUoZnJvbSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkZWxldGUgdGhpcy5fc3Vic2NyaWJlSWRNYXBbZnJvbV07XHJcbiAgICBpZiAobWF0Y2hGb3VuZCkge1xyXG4gICAgICB0aGlzLl9sb2dnZXIuaW5mbyhgU3Vic2NyaXB0aW9uIHRvICR7ZXZlbnRUeXBlfSBldmVudHMgd2l0aCBzdWJzY3JpcHRpb24gSWQ6ICR7ZnJvbX0gaGFzIGJlZW4gY2xlYXJlZGApO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9sb2dnZXIud2FybihgU3Vic2NyaXB0aW9uIHRvICR7ZXZlbnRUeXBlfSBldmVudHMgd2l0aCBzdWJzY3JpcHRpb24gSWQ6ICR7ZnJvbX0gY291bGQgbm90IGJlIGNsZWFyZWQgYXMgd2UgZG8gbm90IGhhdmUgYSByZWdpc3RlciBvZiB0aGF0IGV2ZW50IHR5cGUuYCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEb2VzIHRoZSBhdXRoIHByb3ZpZGVyIHJlcXVpcmUgYXV0aGVudGljYXRpb24uXHJcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhdXRoZW50aWNhdGlvbiBpcyByZXF1aXJlZC5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgaXNBdXRoZW50aWNhdGlvblJlcXVpcmVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgaWYgKHRoaXMuX2F1dGhlbnRpY2F0ZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gIXRoaXMuX2F1dGhlbnRpY2F0ZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQZXJmb3JtIHRoZSBsb2dpbiBvcGVyYXRpb24gb24gdGhlIGF1dGggcHJvdmlkZXIuXHJcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbG9naW4gd2FzIHN1Y2Nlc3NmdWwuXHJcbiAgICovXHJcbiAgcHVibGljIGFzeW5jIGxvZ2luKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgdGhpcy5fbG9nZ2VyLmluZm8oJ2xvZ2luIHJlcXVlc3RlZCcpO1xyXG4gICAgaWYgKHRoaXMuX2F1dGhlbnRpY2F0ZWQpIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oJ1VzZXIgYWxyZWFkeSBhdXRoZW50aWNhdGVkJyk7XHJcbiAgICAgIHJldHVybiB0aGlzLl9hdXRoZW50aWNhdGVkO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX2F1dGhPcHRpb25zLmF1dG9Mb2dpbikge1xyXG4gICAgICB0aGlzLl9sb2dnZXIuaW5mbygnYXV0b0xvZ2luIGVuYWJsZWQgaW4gYXV0aCBwcm92aWRlIG1vZHVsZSBzZXR0aW5ncy4gRmFrZSBsb2dnZWQgaW4nKTtcclxuICAgICAgdGhpcy5fYXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gYXdhaXQgdGhpcy5nZXRBdXRoZW50aWNhdGlvbkZyb21Vc2VyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX2F1dGhlbnRpY2F0ZWQpIHtcclxuICAgICAgdGhpcy5jaGVja0ZvclNlc3Npb25FeHBpcnkoKTtcclxuICAgICAgYXdhaXQgdGhpcy5ub3RpZnlTdWJzY3JpYmVycygnbG9nZ2VkLWluJywgdGhpcy5fbG9nZ2VkSW5TdWJzY3JpYmVycyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjbGVhckN1cnJlbnRVc2VyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2F1dGhlbnRpY2F0ZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQZXJmb3JtIHRoZSBsb2dvdXQgb3BlcmF0aW9uIG9uIHRoZSBhdXRoIHByb3ZpZGVyLlxyXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGxvZ291dCB3YXMgc3VjY2Vzc2Z1bC5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgbG9nb3V0KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5oYW5kbGVMb2dvdXQocmVzb2x2ZSlcclxuICAgICAgICAudGhlbihhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLl9sb2dnZXIuaW5mbygnTG9nIG91dCBjYWxsZWQnKTtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgdGhpcy5fbG9nZ2VyLmVycm9yKGBFcnJvciB3aGlsZSB0cnlpbmcgdG8gbG9nIG91dCAke2Vycm9yfWApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdXNlciBpbmZvcm1hdGlvbiBmcm9tIHRoZSBhdXRoIHByb3ZpZGVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBnZXRVc2VySW5mbygpOiBQcm9taXNlPHVua25vd24+IHtcclxuICAgIGlmICh0aGlzLl9hdXRoZW50aWNhdGVkID09PSB1bmRlZmluZWQgfHwgIXRoaXMuX2F1dGhlbnRpY2F0ZWQpIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLndhcm4oJ1VuYWJsZSB0byByZXRyaWV2ZSB1c2VyIGluZm8gdW5sZXNzIHRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQnKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9sb2dnZXIuaW5mbygnVGhpcyBleGFtcGxlIHJldHVybnMgYSB1c2VyIGlmIGl0IHdhcyBwcm92aWRlZCB0byB0aGUgZXhhbXBsZSBsb2dpbicpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLl9jdXJyZW50VXNlcjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBnZXRBdXRoZW50aWNhdGlvbkZyb21Vc2VyKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5vcGVuTG9naW5XaW5kb3codGhpcy5fYXV0aE9wdGlvbnMubG9naW5VcmwpXHJcbiAgICAgICAgLnRoZW4oYXN5bmMgKHdpbikgPT4ge1xyXG4gICAgICAgICAgY29uc3QgYXV0aE1hdGNoID0gbmV3IFJlZ0V4cCh0aGlzLl9hdXRoT3B0aW9ucy5hdXRoZW50aWNhdGVkVXJsLCAnaScpO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICh3aW4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCB3aW4uZ2V0SW5mbygpO1xyXG4gICAgICAgICAgICAgIGlmIChhdXRoTWF0Y2gudGVzdChpbmZvLnVybCkpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHdpbi5jbG9zZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBhd2FpdCB3aW4uc2hvdyh0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmVycm9yKGBFcnJvciB3aGlsZSBjaGVja2luZyBpZiBsb2dpbiB3aW5kb3cgYXV0b21hdGljYWxseSByZWRpcmVjdGVkLiBFcnJvciAke2Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgIGlmICh3aW4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIGF3YWl0IHdpbi5zaG93KHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGV0IHN0YXR1c0NoZWNrOiBudW1iZXI7XHJcblxyXG4gICAgICAgICAgYXdhaXQgd2luLmFkZExpc3RlbmVyKCdjbG9zZWQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh3aW4pIHtcclxuICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChzdGF0dXNDaGVjayk7XHJcbiAgICAgICAgICAgICAgc3RhdHVzQ2hlY2sgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oJ0F1dGggV2luZG93IGNhbmNlbGxlZCBieSB1c2VyJyk7XHJcbiAgICAgICAgICAgICAgd2luID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBzdGF0dXNDaGVjayA9IHdpbmRvdy5zZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh3aW4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCB3aW4uZ2V0SW5mbygpO1xyXG4gICAgICAgICAgICAgIGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaXNPcGVuZmluQXV0aGVudGljYXRlZCcpID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgICAgIC8vIGF4aW9zXHJcbiAgICAgICAgICAgICAgICAvLyAgIC5wb3N0KCdodHRwOi8vbG9jYWxob3N0OjgwODMvQXV0aGVudGljYXRlVXNlci9Jbml0aWFsaXplRGF0YScsIHt9LCB7IHRpbWVvdXQ6IDEyMDAwMCB9KVxyXG4gICAgICAgICAgICAgICAgLy8gICAudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vICAgICB2YXIgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXNwb25zZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIC8vICAgfSlcclxuICAgICAgICAgICAgICAgIC8vICAgLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIC8vICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKHRoaXMuX2F1dGhlbnRpY2F0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHN0YXR1c0NoZWNrKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHdpbi5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHdpbi5jbG9zZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIHRoaXMuX2F1dGhPcHRpb25zLmNoZWNrTG9naW5TdGF0dXNJblNlY29uZHMgPz8gMSAqIDEwMDApO1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLl9sb2dnZXIuZXJyb3IoJ0Vycm9yIHdoaWxlIHRyeWluZyB0byBhdXRoZW50aWNhdGUgdGhlIHVzZXInLCBlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgY2hlY2tGb3JTZXNzaW9uRXhwaXJ5KGZvcmNlID0gZmFsc2UpIHtcclxuICAgIGlmICh0aGlzLl9hdXRoT3B0aW9ucz8uY2hlY2tTZXNzaW9uVmFsaWRpdHlJblNlY29uZHMgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9hdXRoT3B0aW9ucz8uY2hlY2tTZXNzaW9uVmFsaWRpdHlJblNlY29uZHMgPiAtMSAmJiB0aGlzLl9zZXNzaW9uRXhwaXJ5Q2hlY2tJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuX3Nlc3Npb25FeHBpcnlDaGVja0lkID0gd2luZG93LnNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuX3Nlc3Npb25FeHBpcnlDaGVja0lkID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGNvbnN0IHN0aWxsQXV0aGVudGljYXRlZCA9IGF3YWl0IHRoaXMuY2hlY2tBdXRoKHRoaXMuX2F1dGhPcHRpb25zLmxvZ2luVXJsKTtcclxuICAgICAgICBpZiAoc3RpbGxBdXRoZW50aWNhdGVkKSB7XHJcbiAgICAgICAgICB0aGlzLl9sb2dnZXIuaW5mbygnU2Vzc2lvbiBTdGlsbCBBY3RpdmUnKTtcclxuICAgICAgICAgIHRoaXMuY2hlY2tGb3JTZXNzaW9uRXhwaXJ5KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKFxyXG4gICAgICAgICAgICAnU2Vzc2lvbiBub3QgdmFsaWQuIEtpbGxpbmcgc2Vzc2lvbiBhbmQgbm90aWZ5aW5nIHJlZ2lzdGVyZWQgY2FsbGJhY2sgdGhhdCBhdXRoZW50aWNhdGlvbiBpcyByZXF1aXJlZC4gVGhpcyBjaGVjayBpcyBjb25maWd1cmVkIGluIHRoZSBkYXRhIGZvciB0aGlzIG5pcnZhbmEgYXV0aCBtb2R1bGUuIFNldCBjaGVja1Nlc3Npb25WYWxpZGl0eUluU2Vjb25kcyB0byAtMSBpbiB0aGUgYXV0aFByb3ZpZGVyIG1vZHVsZSBkZWZpbml0aW9uIGlmIHlvdSB3aXNoIHRvIGRpc2FibGUgdGhpcyBjaGVjaycsXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgdGhpcy5fYXV0aGVudGljYXRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgY2xlYXJDdXJyZW50VXNlcigpO1xyXG4gICAgICAgICAgYXdhaXQgdGhpcy5ub3RpZnlTdWJzY3JpYmVycygnc2Vzc2lvbi1leHBpcmVkJywgdGhpcy5fc2Vzc2lvbkV4cGlyZWRTdWJzY3JpYmVycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB0aGlzLl9hdXRoT3B0aW9ucy5jaGVja1Nlc3Npb25WYWxpZGl0eUluU2Vjb25kcyAqIDEwMDApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBub3RpZnlTdWJzY3JpYmVycyhldmVudFR5cGU6IHN0cmluZywgc3Vic2NyaWJlcnM6IE1hcDxzdHJpbmcsICgpID0+IFByb21pc2U8dm9pZD4+KSB7XHJcbiAgICBjb25zdCBzdWJzY3JpYmVySWRzID0gQXJyYXkuZnJvbShzdWJzY3JpYmVycy5rZXlzKCkpO1xyXG4gICAgc3Vic2NyaWJlcklkcy5yZXZlcnNlKCk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVySWRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHN1YnNjcmliZXJJZCA9IHN1YnNjcmliZXJJZHNbaV07XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKGBOb3RpZnlpbmcgc3Vic2NyaWJlciB3aXRoIHN1YnNjcmlwdGlvbiBJZDogJHtzdWJzY3JpYmVySWR9IG9mIGV2ZW50IHR5cGU6ICR7ZXZlbnRUeXBlfWApO1xyXG4gICAgICBhd2FpdCBzdWJzY3JpYmVycy5nZXQoc3Vic2NyaWJlcklkKSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVMb2dvdXQocmVzb2x2ZTogKHN1Y2Nlc3M6IGJvb2xlYW4pID0+IHZvaWQpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICh0aGlzLl9hdXRoZW50aWNhdGVkID09PSB1bmRlZmluZWQgfHwgIXRoaXMuX2F1dGhlbnRpY2F0ZWQpIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLmVycm9yKCdZb3UgaGF2ZSByZXF1ZXN0ZWQgdG8gbG9nIG91dCBidXQgYXJlIG5vdCBsb2dnZWQgaW4nKTtcclxuICAgICAgcmVzb2x2ZShmYWxzZSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuX2xvZ2dlci5pbmZvKCdMb2cgb3V0IHJlcXVlc3RlZCcpO1xyXG4gICAgYXdhaXQgdGhpcy5ub3RpZnlTdWJzY3JpYmVycygnYmVmb3JlLWxvZ2dlZC1vdXQnLCB0aGlzLl9iZWZvcmVMb2dnZWRPdXRTdWJzY3JpYmVycyk7XHJcbiAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICBjbGVhckN1cnJlbnRVc2VyKCk7XHJcbiAgICBpZiAodGhpcy5fYXV0aE9wdGlvbnMubG9nb3V0VXJsICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fYXV0aE9wdGlvbnMubG9nb3V0VXJsICE9PSBudWxsICYmIHRoaXMuX2F1dGhPcHRpb25zLmxvZ291dFVybC50cmltKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHdpbiA9IGF3YWl0IHRoaXMub3BlbkxvZ291dFdpbmRvdyh0aGlzLl9hdXRoT3B0aW9ucy5sb2dvdXRVcmwpO1xyXG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgYXdhaXQgd2luLmNsb3NlKCk7XHJcbiAgICAgICAgICBhd2FpdCB0aGlzLm5vdGlmeVN1YnNjcmliZXJzKCdsb2dnZWQtb3V0JywgdGhpcy5fbG9nZ2VkT3V0U3Vic2NyaWJlcnMpO1xyXG4gICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcclxuICAgICAgICB9LCAyMDAwKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICB0aGlzLl9sb2dnZXIuZXJyb3IoYEVycm9yIHdoaWxlIGxhdW5jaGluZyBsb2dvdXQgd2luZG93LiAke2Vycm9yfWApO1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhdXRoZW50aWNhdGlvblR5cGUnKSA9PT0gJ0RBVEFCQVNFX0xPR0lOJyAmJiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKSkge1xyXG4gICAgICBjb25zdCB3aW4gPSBhd2FpdCB0aGlzLm9wZW5Mb2dvdXRXaW5kb3codGhpcy5fYXV0aE9wdGlvbnMubG9nb3V0VXJsKTtcclxuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgyL0xvZ291dCc7XHJcbiAgICAgIHRoaXMucmVtb3ZlVXNlcigpO1xyXG4gICAgICBhd2FpdCB3aW4uY2xvc2UoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGF3YWl0IHRoaXMubm90aWZ5U3Vic2NyaWJlcnMoJ2xvZ2dlZC1vdXQnLCB0aGlzLl9sb2dnZWRPdXRTdWJzY3JpYmVycyk7XHJcbiAgICAgIHJlc29sdmUodHJ1ZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIG9wZW5Mb2dpbldpbmRvdyh1cmw6IHN0cmluZyk6IFByb21pc2U8T3BlbkZpbi5XaW5kb3c+IHtcclxuICAgIGNvbnN0IGVucmljaGVkQ3VzdG9tRGF0YSA9IHtcclxuICAgICAgY3VycmVudFVzZXJLZXk6IEVYQU1QTEVfQVVUSF9DVVJSRU5UX1VTRVJfS0VZLFxyXG4gICAgICAuLi50aGlzLl9hdXRoT3B0aW9ucz8uY3VzdG9tRGF0YSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gZmluLldpbmRvdy5jcmVhdGUoe1xyXG4gICAgICBuYW1lOiAnbmlydmFuYS1hdXRoLWxvZy1pbicsXHJcbiAgICAgIGFsd2F5c09uVG9wOiBmYWxzZSxcclxuICAgICAgbWF4aW1pemFibGU6IGZhbHNlLFxyXG4gICAgICBtaW5pbWl6YWJsZTogdHJ1ZSxcclxuICAgICAgYXV0b1Nob3c6IGZhbHNlLFxyXG4gICAgICBkZWZhdWx0Q2VudGVyZWQ6IHRydWUsXHJcbiAgICAgIGRlZmF1bHRIZWlnaHQ6IHRoaXMuX2F1dGhPcHRpb25zLmxvZ2luSGVpZ2h0ID8/IDYwMCxcclxuICAgICAgZGVmYXVsdFdpZHRoOiB0aGlzLl9hdXRoT3B0aW9ucy5sb2dpbldpZHRoID8/IDUwMCxcclxuICAgICAgaW5jbHVkZUluU25hcHNob3RzOiBmYWxzZSxcclxuICAgICAgcmVzaXphYmxlOiBmYWxzZSxcclxuICAgICAgc2hvd1Rhc2tiYXJJY29uOiB0cnVlLFxyXG4gICAgICBzYXZlV2luZG93U3RhdGU6IGZhbHNlLFxyXG4gICAgICB1cmwsXHJcbiAgICAgIGN1c3RvbURhdGE6IGVucmljaGVkQ3VzdG9tRGF0YSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBvcGVuTG9nb3V0V2luZG93KHVybDogc3RyaW5nKTogUHJvbWlzZTxPcGVuRmluLldpbmRvdz4ge1xyXG4gICAgcmV0dXJuIGZpbi5XaW5kb3cuY3JlYXRlKHtcclxuICAgICAgbmFtZTogJ25pcnZhbmEtYXV0aC1sb2ctb3V0JyxcclxuICAgICAgbWF4aW1pemFibGU6IGZhbHNlLFxyXG4gICAgICBtaW5pbWl6YWJsZTogZmFsc2UsXHJcbiAgICAgIGF1dG9TaG93OiBmYWxzZSxcclxuICAgICAgZGVmYXVsdENlbnRlcmVkOiB0cnVlLFxyXG4gICAgICBkZWZhdWx0SGVpZ2h0OiB0aGlzLl9hdXRoT3B0aW9ucy5sb2dpbkhlaWdodCA/PyAzMjAsXHJcbiAgICAgIGRlZmF1bHRXaWR0aDogdGhpcy5fYXV0aE9wdGlvbnMubG9naW5XaWR0aCA/PyA0MDAsXHJcbiAgICAgIGluY2x1ZGVJblNuYXBzaG90czogZmFsc2UsXHJcbiAgICAgIHJlc2l6YWJsZTogZmFsc2UsXHJcbiAgICAgIHNob3dUYXNrYmFySWNvbjogZmFsc2UsXHJcbiAgICAgIHNhdmVXaW5kb3dTdGF0ZTogZmFsc2UsXHJcbiAgICAgIHVybCxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBjaGVja0F1dGgodXJsOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIGNvbnN0IHdpbmRvd1RvQ2hlY2sgPSBhd2FpdCBmaW4uV2luZG93LmNyZWF0ZSh7XHJcbiAgICAgIG5hbWU6ICduaXJ2YW5hLWF1dGgtY2hlY2std2luZG93JyxcclxuICAgICAgYWx3YXlzT25Ub3A6IHRydWUsXHJcbiAgICAgIG1heGltaXphYmxlOiBmYWxzZSxcclxuICAgICAgbWluaW1pemFibGU6IGZhbHNlLFxyXG4gICAgICBhdXRvU2hvdzogZmFsc2UsXHJcbiAgICAgIGRlZmF1bHRIZWlnaHQ6IHRoaXMuX2F1dGhPcHRpb25zLmxvZ2luSGVpZ2h0ID8/IDMyNSxcclxuICAgICAgZGVmYXVsdFdpZHRoOiB0aGlzLl9hdXRoT3B0aW9ucy5sb2dpbldpZHRoID8/IDQwMCxcclxuICAgICAgaW5jbHVkZUluU25hcHNob3RzOiBmYWxzZSxcclxuICAgICAgcmVzaXphYmxlOiBmYWxzZSxcclxuICAgICAgc2hvd1Rhc2tiYXJJY29uOiBmYWxzZSxcclxuICAgICAgc2F2ZVdpbmRvd1N0YXRlOiBmYWxzZSxcclxuICAgICAgdXJsLFxyXG4gICAgfSk7XHJcbiAgICBsZXQgaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbmZvID0gYXdhaXQgd2luZG93VG9DaGVjay5nZXRJbmZvKCk7XHJcbiAgICAgIGlmIChpbmZvLnVybCA9PT0gdGhpcy5fYXV0aE9wdGlvbnMuYXV0aGVudGljYXRlZFVybCkge1xyXG4gICAgICAgIGlzQXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5lcnJvcignRXJyb3IgZW5jb3VudGVyZWQgd2hpbGUgY2hlY2tpbmcgc2Vzc2lvbicsIGVycm9yKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIGlmICh3aW5kb3dUb0NoZWNrICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBhd2FpdCB3aW5kb3dUb0NoZWNrLmNsb3NlKHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaXNBdXRoZW50aWNhdGVkO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgdHlwZSB7IEN1c3RvbVNldHRpbmdzLCBQbGF0Zm9ybUFwcCB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBFbmRwb2ludCwgRW5kcG9pbnREZWZpbml0aW9uLCBGZXRjaE9wdGlvbnMgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy9lbmRwb2ludC1zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IExvZ2dlciwgTG9nZ2VyQ3JlYXRvciB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL2xvZ2dlci1zaGFwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IE1vZHVsZURlZmluaXRpb24sIE1vZHVsZUhlbHBlcnMgfSBmcm9tICdjdXN0b21pemUtd29ya3NwYWNlL3NoYXBlcy9tb2R1bGUtc2hhcGVzJztcclxuaW1wb3J0IHR5cGUgeyBFeGFtcGxlRW5kcG9pbnRPcHRpb25zLCBFeGFtcGxlVXNlclJvbGVNYXBwaW5nIH0gZnJvbSAnLi9zaGFwZXMnO1xyXG5pbXBvcnQgeyBnZXRDdXJyZW50VXNlciB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5leHBvcnQgY2xhc3MgRXhhbXBsZUF1dGhFbmRwb2ludCBpbXBsZW1lbnRzIEVuZHBvaW50PEV4YW1wbGVFbmRwb2ludE9wdGlvbnM+IHtcclxuICBwcml2YXRlIF9kZWZpbml0aW9uOiBNb2R1bGVEZWZpbml0aW9uPEV4YW1wbGVFbmRwb2ludE9wdGlvbnM+O1xyXG5cclxuICBwcml2YXRlIF9sb2dnZXI6IExvZ2dlcjtcclxuXHJcbiAgcHJpdmF0ZSBfcm9sZU1hcHBpbmc6IHsgW2tleTogc3RyaW5nXTogRXhhbXBsZVVzZXJSb2xlTWFwcGluZyB9O1xyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXNlIHRoZSBtb2R1bGUuXHJcbiAgICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gb2YgdGhlIG1vZHVsZSBmcm9tIGNvbmZpZ3VyYXRpb24gaW5jbHVkZSBjdXN0b20gb3B0aW9ucy5cclxuICAgKiBAcGFyYW0gbG9nZ2VyQ3JlYXRvciBGb3IgbG9nZ2luZyBlbnRyaWVzLlxyXG4gICAqIEBwYXJhbSBoZWxwZXJzIEhlbHBlciBtZXRob2RzIGZvciB0aGUgbW9kdWxlIHRvIGludGVyYWN0IHdpdGggdGhlIGFwcGxpY2F0aW9uIGNvcmUuXHJcbiAgICogQHJldHVybnMgTm90aGluZy5cclxuICAgKi9cclxuICBwdWJsaWMgYXN5bmMgaW5pdGlhbGl6ZShkZWZpbml0aW9uOiBNb2R1bGVEZWZpbml0aW9uPEV4YW1wbGVFbmRwb2ludE9wdGlvbnM+LCBjcmVhdGVMb2dnZXI6IExvZ2dlckNyZWF0b3IsIGhlbHBlcnM/OiBNb2R1bGVIZWxwZXJzKSB7XHJcbiAgICB0aGlzLl9sb2dnZXIgPSBjcmVhdGVMb2dnZXIoJ0V4YW1wbGVBdXRoRW5kcG9pbnQnKTtcclxuICAgIHRoaXMuX2xvZ2dlci5pbmZvKCdXYXMgcGFzc2VkIHRoZSBmb2xsb3dpbmcgb3B0aW9ucycsIGRlZmluaXRpb24uZGF0YSk7XHJcbiAgICB0aGlzLl9yb2xlTWFwcGluZyA9IGRlZmluaXRpb24/LmRhdGE/LnJvbGVNYXBwaW5nO1xyXG4gICAgdGhpcy5fZGVmaW5pdGlvbiA9IGRlZmluaXRpb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgYSByZXF1ZXN0IHJlc3BvbnNlIG9uIGFuIGVuZHBvaW50LlxyXG4gICAqIEBwYXJhbSBlbmRwb2ludERlZmluaXRpb24gVGhlIGRlZmluaXRpb24gb2YgdGhlIGVuZHBvaW50LlxyXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSByZXF1ZXN0IHRvIHByb2Nlc3MuXHJcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlIHRvIHRoZSByZXF1ZXN0LCBvciBudWxsIG9mIG5vdCBoYW5kbGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyByZXF1ZXN0UmVzcG9uc2UoZW5kcG9pbnREZWZpbml0aW9uOiBFbmRwb2ludERlZmluaXRpb248RmV0Y2hPcHRpb25zPiwgcmVxdWVzdD86IHVua25vd24pOiBQcm9taXNlPHVua25vd24+IHtcclxuICAgIGlmIChlbmRwb2ludERlZmluaXRpb24udHlwZSAhPT0gJ21vZHVsZScpIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLndhcm4oYFdlIG9ubHkgZXhwZWN0IGVuZHBvaW50cyBvZiB0eXBlIG1vZHVsZS4gVW5hYmxlIHRvIGFjdGlvbiByZXF1ZXN0L3Jlc3BvbnNlIGZvcjogJHtlbmRwb2ludERlZmluaXRpb24uaWR9YCk7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX2xvZ2dlciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKFxyXG4gICAgICAgICdUaGlzIGF1dGggZW5kcG9pbnQgbW9kdWxlIGlzIGFuIGV4YW1wbGUgdGhhdCB0aGF0IHNpbXVsYXRlcyByZXF1ZXN0aW5nIGEgaHR0cCBlbmRwb2ludCBhbmQgbWFuaXB1bGF0aW5nIGl0IGJhc2VkIG9uIHRoZSBjdXJyZW50IGV4YW1wbGUgdXNlciBhcyBpZiBpdCB3YXMgdGhlIHNlcnZlciBkb2luZyB0aGUgbWFuaXB1bGF0aW9uLiBETyBOT1QgVVNFIFRISVMgTU9EVUxFIElOIFBST0RVQ1RJT04uJyxcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IHVybCwgLi4ub3B0aW9ucyB9OiBGZXRjaE9wdGlvbnMgPSBlbmRwb2ludERlZmluaXRpb24ub3B0aW9ucztcclxuXHJcbiAgICBjb25zdCByZXEgPSB0aGlzLmdldFJlcXVlc3RPcHRpb25zKHVybCBhcyBzdHJpbmcsIG9wdGlvbnMsIHJlcXVlc3QpO1xyXG4gICAgaWYgKHJlcS5vcHRpb25zLm1ldGhvZCAhPT0gJ0dFVCcgJiYgcmVxLm9wdGlvbnMubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLndhcm4oYCR7ZW5kcG9pbnREZWZpbml0aW9uLmlkfSBzcGVjaWZpZXMgYSB0eXBlOiAke2VuZHBvaW50RGVmaW5pdGlvbi50eXBlfSB3aXRoIGEgbWV0aG9kICR7cmVxLm9wdGlvbnMubWV0aG9kfSB0aGF0IGlzIG5vdCBzdXBwb3J0ZWQuYCk7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2gocmVxLnVybCwgcmVxLm9wdGlvbnMgYXMgUmVxdWVzdEluaXQpO1xyXG5cclxuICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShqc29uKSkge1xyXG4gICAgICAgIC8vIHJldHVybmVkIGFwcHNcclxuICAgICAgICByZXR1cm4gdGhpcy5hcHBseUN1cnJlbnRVc2VyVG9BcHBzKGpzb24pIGFzIHVua25vd247XHJcbiAgICAgIH1cclxuICAgICAgLy8gc2V0dGluZ3NcclxuICAgICAgcmV0dXJuIHRoaXMuYXBwbHlDdXJyZW50VXNlclRvU2V0dGluZ3MoanNvbikgYXMgdW5rbm93bjtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRSZXF1ZXN0T3B0aW9ucyh1cmw6IHN0cmluZywgb3B0aW9uczogRmV0Y2hPcHRpb25zLCByZXF1ZXN0OiB1bmtub3duKTogeyB1cmw6IHN0cmluZzsgb3B0aW9uczogRmV0Y2hPcHRpb25zIH0ge1xyXG4gICAgaWYgKG9wdGlvbnMubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICBpZiAocmVxdWVzdCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHJlcXVlc3QpO1xyXG4gICAgICAgIGlmIChrZXlzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IGtleXMubGVuZ3RoO1xyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB1cmwgPSB1cmwucmVwbGFjZShgWyR7a2V5c1tpXX1dYCwgZW5jb2RlVVJJQ29tcG9uZW50KHJlcXVlc3Rba2V5c1tpXV0gYXMgc3RyaW5nKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMubWV0aG9kID09PSAnUE9TVCcgJiYgcmVxdWVzdCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIG9wdGlvbnMuYm9keSA9IEpTT04uc3RyaW5naWZ5KHJlcXVlc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7IHVybCwgb3B0aW9ucyB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseUN1cnJlbnRVc2VyVG9BcHBzKGFwcHM6IFBsYXRmb3JtQXBwW10gPSBbXSk6IFBsYXRmb3JtQXBwW10ge1xyXG4gICAgY29uc3QgY3VycmVudFVzZXIgPSBnZXRDdXJyZW50VXNlcigpO1xyXG4gICAgaWYgKFxyXG4gICAgICBjdXJyZW50VXNlciA9PT0gbnVsbCB8fFxyXG4gICAgICB0aGlzLl9yb2xlTWFwcGluZyA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgIHRoaXMuX3JvbGVNYXBwaW5nW2N1cnJlbnRVc2VyLnJvbGVdID09PSB1bmRlZmluZWQgfHxcclxuICAgICAgdGhpcy5fcm9sZU1hcHBpbmdbY3VycmVudFVzZXIucm9sZV0uZXhjbHVkZUFwcHNXaXRoVGFnID09PSB1bmRlZmluZWRcclxuICAgICkge1xyXG4gICAgICByZXR1cm4gYXBwcztcclxuICAgIH1cclxuICAgIGNvbnN0IGV4Y2x1ZGVUYWcgPSB0aGlzLl9yb2xlTWFwcGluZ1tjdXJyZW50VXNlci5yb2xlXS5leGNsdWRlQXBwc1dpdGhUYWc7XHJcbiAgICBjb25zdCBmaWx0ZXJlZEFwcHM6IFBsYXRmb3JtQXBwW10gPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXBwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShhcHBzW2ldLnRhZ3MpKSB7XHJcbiAgICAgICAgbGV0IGluY2x1ZGUgPSB0cnVlO1xyXG4gICAgICAgIGZvciAobGV0IHQgPSAwOyB0IDwgYXBwc1tpXS50YWdzLmxlbmd0aDsgdCsrKSB7XHJcbiAgICAgICAgICBjb25zdCB0YWc6IHN0cmluZyA9IGFwcHNbaV0udGFnc1t0XTtcclxuICAgICAgICAgIGlmIChleGNsdWRlVGFnLmluY2x1ZGVzKHRhZykpIHtcclxuICAgICAgICAgICAgaW5jbHVkZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGluY2x1ZGUpIHtcclxuICAgICAgICAgIGZpbHRlcmVkQXBwcy5wdXNoKGFwcHNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmaWx0ZXJlZEFwcHMucHVzaChhcHBzW2ldKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZpbHRlcmVkQXBwcztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXBwbHlDdXJyZW50VXNlclRvU2V0dGluZ3Moc2V0dGluZ3M6IEN1c3RvbVNldHRpbmdzKTogQ3VzdG9tU2V0dGluZ3Mge1xyXG4gICAgY29uc3QgY3VycmVudFVzZXIgPSBnZXRDdXJyZW50VXNlcigpO1xyXG4gICAgaWYgKGN1cnJlbnRVc2VyID09PSBudWxsIHx8IHRoaXMuX3JvbGVNYXBwaW5nID09PSB1bmRlZmluZWQgfHwgdGhpcy5fcm9sZU1hcHBpbmdbY3VycmVudFVzZXIucm9sZV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gc2V0dGluZ3M7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2V0dGluZ3M/LmVuZHBvaW50UHJvdmlkZXI/Lm1vZHVsZXMpKSB7XHJcbiAgICAgIHNldHRpbmdzLmVuZHBvaW50UHJvdmlkZXIubW9kdWxlcy5wdXNoKHtcclxuICAgICAgICBkYXRhOiB0aGlzLl9kZWZpbml0aW9uLFxyXG4gICAgICAgIGVuYWJsZWQ6IHRoaXMuX2RlZmluaXRpb24uZW5hYmxlZCxcclxuICAgICAgICBpZDogdGhpcy5fZGVmaW5pdGlvbi5pZCxcclxuICAgICAgICBkZXNjcmlwdGlvbjogdGhpcy5fZGVmaW5pdGlvbi5kZXNjcmlwdGlvbixcclxuICAgICAgICBpY29uOiB0aGlzLl9kZWZpbml0aW9uLmljb24sXHJcbiAgICAgICAgaW5mbzogdGhpcy5fZGVmaW5pdGlvbi5pbmZvLFxyXG4gICAgICAgIHRpdGxlOiB0aGlzLl9kZWZpbml0aW9uLnRpdGxlLFxyXG4gICAgICAgIHVybDogdGhpcy5fZGVmaW5pdGlvbi51cmwsXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShzZXR0aW5ncz8uZW5kcG9pbnRQcm92aWRlcj8uZW5kcG9pbnRzKSAmJiBBcnJheS5pc0FycmF5KHNldHRpbmdzPy5hcHBQcm92aWRlcj8uZW5kcG9pbnRJZHMpKSB7XHJcbiAgICAgICAgY29uc3QgYXBwRW5kcG9pbnRzID0gc2V0dGluZ3M/LmFwcFByb3ZpZGVyPy5lbmRwb2ludElkcztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFwcEVuZHBvaW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiBhcHBFbmRwb2ludHNbaV0gPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVuZHBvaW50VG9VcGRhdGUgPSBzZXR0aW5ncy5lbmRwb2ludFByb3ZpZGVyLmVuZHBvaW50cy5maW5kKChlbmRwb2ludEVudHJ5KSA9PiBlbmRwb2ludEVudHJ5LmlkID09PSBhcHBFbmRwb2ludHNbaV0gJiYgZW5kcG9pbnRFbnRyeS50eXBlID09PSAnZmV0Y2gnKTtcclxuICAgICAgICAgICAgaWYgKGVuZHBvaW50VG9VcGRhdGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIGVuZHBvaW50VG9VcGRhdGUudHlwZSA9ICdtb2R1bGUnO1xyXG4gICAgICAgICAgICAgIC8vIHRoaXMgaWYgY29uZGl0aW9uIGNoZWNrIGlzIGhlcmUgdG8gbWFrZSB0eXBlc2NyaXB0IGhhcHB5IHdpdGggdGhlIGVuZHBvaW50IHNvIHRoYXQgdHlwZUlkIGNhbiBiZSBzZXRcclxuICAgICAgICAgICAgICBpZiAoZW5kcG9pbnRUb1VwZGF0ZS50eXBlID09PSAnbW9kdWxlJykge1xyXG4gICAgICAgICAgICAgICAgZW5kcG9pbnRUb1VwZGF0ZS50eXBlSWQgPSB0aGlzLl9kZWZpbml0aW9uLmlkO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHNldHRpbmdzPy50aGVtZVByb3ZpZGVyPy50aGVtZXMpICYmIHNldHRpbmdzLnRoZW1lUHJvdmlkZXIudGhlbWVzLmxlbmd0aCA+IDAgJiYgdGhpcy5fcm9sZU1hcHBpbmdbY3VycmVudFVzZXIucm9sZV0ucHJlZmVycmVkU2NoZW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgc2V0dGluZ3MudGhlbWVQcm92aWRlci50aGVtZXNbMF0uZGVmYXVsdCA9IHRoaXMuX3JvbGVNYXBwaW5nW2N1cnJlbnRVc2VyLnJvbGVdLnByZWZlcnJlZFNjaGVtZSA9PT0gJ2RhcmsnID8gJ2RhcmsnIDogJ2xpZ2h0JztcclxuICAgICAgY29uc3Qgc3RvcmVkU2NoZW1lUHJlZmVyZW5jZSA9IGAke2Zpbi5tZS5pZGVudGl0eS51dWlkfS1TZWxlY3RlZENvbG9yU2NoZW1lYDtcclxuICAgICAgdGhpcy5fbG9nZ2VyLndhcm4oXHJcbiAgICAgICAgXCJUaGlzIGlzIGEgZGVtbyBtb2R1bGUgd2hlcmUgd2UgYXJlIGNsZWFyaW5nIHRoZSBsb2NhbGx5IHN0b3JlZCBzY2hlbWUgcHJlZmVyZW5jZSBpbiBvcmRlciB0byBzaG93IGRpZmZlcmVudCBzY2hlbWUncyBsaWdodC9kYXJrIGJhc2VkIG9uIHVzZXIgc2VsZWN0aW9uLiBUaGlzIG1lYW5zIHRoYXQgaXQgd2lsbCBhbHdheXMgYmUgc2V0IHRvIHdoYXQgaXMgaW4gdGhlIHJvbGUgbWFwcGluZyBpbml0aWFsbHkgYW5kIG5vdCB3aGF0IGl0IGlzIHNldCB0byBsb2NhbGx5IG9uIHJlc3RhcnQuXCIsXHJcbiAgICAgICk7XHJcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHN0b3JlZFNjaGVtZVByZWZlcmVuY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGV4Y2x1ZGVNZW51QWN0aW9uSWRzID0gdGhpcy5fcm9sZU1hcHBpbmdbY3VycmVudFVzZXIucm9sZV0uZXhjbHVkZU1lbnVBY3Rpb247XHJcblxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZXhjbHVkZU1lbnVBY3Rpb25JZHMpKSB7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHNldHRpbmdzPy5icm93c2VyUHJvdmlkZXI/Lmdsb2JhbE1lbnUpICYmIHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci5nbG9iYWxNZW51Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci5nbG9iYWxNZW51Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBjb25zdCBnbG9iYWxNZW51QWN0aW9uSWQ6IHN0cmluZyA9IHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci5nbG9iYWxNZW51W2ldPy5kYXRhPy5hY3Rpb24/LmlkO1xyXG4gICAgICAgICAgaWYgKGV4Y2x1ZGVNZW51QWN0aW9uSWRzLmluY2x1ZGVzKGdsb2JhbE1lbnVBY3Rpb25JZCkpIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MuYnJvd3NlclByb3ZpZGVyLmdsb2JhbE1lbnVbaV0uaW5jbHVkZSA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2V0dGluZ3M/LmJyb3dzZXJQcm92aWRlcj8ucGFnZU1lbnUpICYmIHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci5wYWdlTWVudS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZXR0aW5ncy5icm93c2VyUHJvdmlkZXIucGFnZU1lbnUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGNvbnN0IHBhZ2VNZW51QWN0aW9uSWQ6IHN0cmluZyA9IHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci5wYWdlTWVudVtpXT8uZGF0YT8uYWN0aW9uPy5pZDtcclxuICAgICAgICAgIGlmIChleGNsdWRlTWVudUFjdGlvbklkcy5pbmNsdWRlcyhwYWdlTWVudUFjdGlvbklkKSkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5icm93c2VyUHJvdmlkZXIucGFnZU1lbnVbaV0uaW5jbHVkZSA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2V0dGluZ3M/LmJyb3dzZXJQcm92aWRlcj8udmlld01lbnUpICYmIHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci52aWV3TWVudS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZXR0aW5ncy5icm93c2VyUHJvdmlkZXIudmlld01lbnUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGNvbnN0IHZpZXdNZW51QWN0aW9uSWQ6IHN0cmluZyA9IHNldHRpbmdzLmJyb3dzZXJQcm92aWRlci52aWV3TWVudVtpXT8uZGF0YT8uYWN0aW9uPy5pZDtcclxuICAgICAgICAgIGlmIChleGNsdWRlTWVudUFjdGlvbklkcy5pbmNsdWRlcyh2aWV3TWVudUFjdGlvbklkKSkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5icm93c2VyUHJvdmlkZXIudmlld01lbnVbaV0uaW5jbHVkZSA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzZXR0aW5ncztcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHR5cGUgeyBFeGFtcGxlVXNlciB9IGZyb20gXCIuL3NoYXBlc1wiO1xyXG5cclxuZXhwb3J0IGNvbnN0IEVYQU1QTEVfQVVUSF9DVVJSRU5UX1VTRVJfS0VZID0gYCR7ZmluLm1lLmlkZW50aXR5LnV1aWR9LUVYQU1QTEVfQVVUSF9DVVJSRU5UX1VTRVJgO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRVc2VyKCk6IEV4YW1wbGVVc2VyIHwgbnVsbCB7XHJcblx0Y29uc3Qgc3RvcmVkVXNlciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKEVYQU1QTEVfQVVUSF9DVVJSRU5UX1VTRVJfS0VZKTtcclxuXHRpZiAoc3RvcmVkVXNlciA9PT0gbnVsbCkge1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cdHJldHVybiBKU09OLnBhcnNlKHN0b3JlZFVzZXIpIGFzIEV4YW1wbGVVc2VyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFVzZXIodXNlcjogRXhhbXBsZVVzZXIpOiB2b2lkIHtcclxuXHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShFWEFNUExFX0FVVEhfQ1VSUkVOVF9VU0VSX0tFWSwgSlNPTi5zdHJpbmdpZnkodXNlcikpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJDdXJyZW50VXNlcigpIHtcclxuXHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShFWEFNUExFX0FVVEhfQ1VSUkVOVF9VU0VSX0tFWSk7XHJcbn1cclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgdHlwZSB7IE1vZHVsZUltcGxlbWVudGF0aW9uLCBNb2R1bGVUeXBlcyB9IGZyb20gJ2N1c3RvbWl6ZS13b3Jrc3BhY2Uvc2hhcGVzL21vZHVsZS1zaGFwZXMnO1xyXG5pbXBvcnQgeyBFeGFtcGxlQXV0aFByb3ZpZGVyIH0gZnJvbSAnLi9hdXRoLXByb3ZpZGVyJztcclxuaW1wb3J0IHsgRXhhbXBsZUF1dGhFbmRwb2ludCB9IGZyb20gJy4vZW5kcG9pbnQnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGVudHJ5UG9pbnRzOiB7IFt0eXBlIGluIE1vZHVsZVR5cGVzXT86IE1vZHVsZUltcGxlbWVudGF0aW9uIH0gPSB7XHJcbiAgYXV0aDogbmV3IEV4YW1wbGVBdXRoUHJvdmlkZXIoKSxcclxuICBlbmRwb2ludDogbmV3IEV4YW1wbGVBdXRoRW5kcG9pbnQoKSxcclxufTtcclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9