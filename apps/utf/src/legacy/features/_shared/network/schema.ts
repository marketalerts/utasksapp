export interface paths {
    "/admin/checkpayments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    mode?: string;
                    date?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/checkroles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    mode?: string;
                    date?: string;
                    chatid?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/updatenotif": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/areas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get list of areas */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTAreaModel"][];
                    };
                };
            };
        };
        put?: never;
        /**
         * Add
         * @description Sample request:
         *
         *         POST /areas
         *         {
         *            "name": "My personal"
         *         }
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UTBaseAreaModel"];
                    "text/json": components["schemas"]["UTBaseAreaModel"];
                    "application/*+json": components["schemas"]["UTBaseAreaModel"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTAreaModel"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/areas/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get list of projects without areas */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTProjectModel"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/areas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get an item by id */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTAreaModel"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        /** Обновление области */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UTAreaModel"];
                    "text/json": components["schemas"]["UTAreaModel"];
                    "application/*+json": components["schemas"]["UTAreaModel"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        /** Delete an item */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/areas/{id}/position": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Обновление позиции области */
        put: {
            parameters: {
                query?: {
                    index?: number;
                };
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/areas/{id}/logo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get area logo */
        get: {
            parameters: {
                query?: {
                    token?: string;
                };
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": string;
                    };
                };
            };
        };
        put?: never;
        /** Update area logo */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "multipart/form-data": {
                        /** Format: binary */
                        logo?: string;
                    };
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        /** Delete an item */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Аутентификация и идентификация пользователя */
        post: {
            parameters: {
                query?: {
                    /** @description Telegram initData */
                    initData?: string;
                    /** @description User timezone */
                    timeZone?: number;
                    /** @description User timezone Id */
                    timeZoneId?: string;
                    /** @description User local */
                    locale?: string;
                    /** @description Current project */
                    projectId?: string;
                    /** @description Current project */
                    qa?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": string;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/test/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Тестовая аутентификация и идентификация пользователя */
        post: {
            parameters: {
                query?: {
                    timeZone?: number;
                    locale?: string;
                };
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": string;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/files/{file_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    file_id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payment/result": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Payment result */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "multipart/form-data": {
                        OutSum?: string;
                        /** Format: int64 */
                        InvId?: number;
                        Fee?: string;
                        EMail?: string;
                        SignatureValue?: string;
                        PaymentMethod?: string;
                        IncCurrLabel?: string;
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payment/wallet": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Payment result */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["WalletResult"][];
                    "text/json": components["schemas"]["WalletResult"][];
                    "application/*+json": components["schemas"]["WalletResult"][];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/price": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get prices */
        get: {
            parameters: {
                query?: {
                    /** @description Code */
                    paymentOption?: components["schemas"]["UTPaymentType"];
                    /** @description Code */
                    count?: number;
                    /** @description Code */
                    isRedeem?: boolean;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTUserRoleModel"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/price/invoice/{roleCode}/{priceCode}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get invoice link */
        get: {
            parameters: {
                query?: {
                    agreeTerms?: boolean;
                    paymentOption?: components["schemas"]["UTPaymentType"];
                    count?: number;
                    isRedeem?: boolean;
                };
                header?: never;
                path: {
                    roleCode: string;
                    priceCode: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": string;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/price/promo/{promocode}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply promocode */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Code */
                    promocode: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/price/redeem/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get redeem */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Code */
                    code: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTRedeemModel"];
                    };
                };
            };
        };
        put?: never;
        /** Apply redeem */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Code */
                    code: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTRedeemModel"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get profile */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTProfileModel"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/profile/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get profile settings */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTSettingsModel"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        /** Put profile settings */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UTSettingsModel"];
                    "text/json": components["schemas"]["UTSettingsModel"];
                    "application/*+json": components["schemas"]["UTSettingsModel"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTSettingsModel"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/profile/{id}/unsubscribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Set is not subscribe status */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get groups of tasks */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTGroupModel"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get list of projects */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTProjectModel"][];
                    };
                };
            };
        };
        put?: never;
        /**
         * Создание проекта
         * @description Sample request:
         *
         *         POST /projects
         *         {
         *            "title": "Project title",
         *            "description": "Project description"
         *         }
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UTBaseProjectModel"];
                    "text/json": components["schemas"]["UTBaseProjectModel"];
                    "application/*+json": components["schemas"]["UTBaseProjectModel"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTProjectModel"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get an item by id */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description project id */
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTProjectModel"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        /** Обновление проекта */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Project id */
                    id: string;
                };
                cookie?: never;
            };
            /** @description Project */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UTProjectModel"];
                    "text/json": components["schemas"]["UTProjectModel"];
                    "application/*+json": components["schemas"]["UTProjectModel"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        /** Delete an item */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{id}/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get tasks of project */
        get: {
            parameters: {
                query?: {
                    /** @description filter by taskGroup */
                    taskGroup?: string;
                    /** @description group by */
                    groupBy?: string;
                    /** @description filter by */
                    filterBy?: components["schemas"]["UTTaskFilterType"];
                };
                header?: never;
                path: {
                    /** @description project id or group code */
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTListTaskModel"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{id}/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get users of project */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description project id */
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTUserModel"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/updateusers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    projectId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{id}/taskcounters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get counters of group or project tasks */
        get: {
            parameters: {
                query?: {
                    /** @description filter by */
                    filterBy?: components["schemas"]["UTTaskFilterType"];
                };
                header?: never;
                path: {
                    /** @description project id or group code */
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTTaskCounterModel"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    projectId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTProjectModel"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{id}/position": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Обновление позицию проекта */
        put: {
            parameters: {
                query?: {
                    /** @description Index */
                    index?: number;
                    /** @description Area id */
                    areaId?: string;
                };
                header?: never;
                path: {
                    /** @description Project id */
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{id}/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get project settings */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTSettingsModel"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        /** Update project settings */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UTSettingsModel"];
                    "text/json": components["schemas"]["UTSettingsModel"];
                    "application/*+json": components["schemas"]["UTSettingsModel"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTSettingsModel"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{id}/logo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Update project logo */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "multipart/form-data": {
                        /** Format: binary */
                        logo?: string;
                    };
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        /** Delete an item */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/projects/{id}/logo/{fileid}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get project logo */
        get: {
            parameters: {
                query?: {
                    token?: string;
                };
                header?: never;
                path: {
                    id: string;
                    fileid: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": string;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/status/tlg": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/status/wtlg": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/status/db": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/status/web": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/status/fb": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get an item by id */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTTaskModel"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        /** Обновление задачи */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UTTaskModel"];
                    "text/json": components["schemas"]["UTTaskModel"];
                    "application/*+json": components["schemas"]["UTTaskModel"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        /** Delete an item */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Error */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Создание новой задачи */
        post: {
            parameters: {
                query?: {
                    projectid?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UTBaseTaskModel"];
                    "text/json": components["schemas"]["UTBaseTaskModel"];
                    "application/*+json": components["schemas"]["UTBaseTaskModel"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTTaskModel"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{id}/attach": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Attach files to task */
        post: {
            parameters: {
                query?: {
                    messageid?: number;
                };
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "multipart/form-data": {
                        files?: string[];
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": number;
                    };
                };
            };
        };
        /** Delete attach files */
        delete: {
            parameters: {
                query?: {
                    messageid?: number;
                };
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": string[];
                    "text/json": string[];
                    "application/*+json": string[];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Set complete status */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTTaskModel"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{id}/uncomplete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Set is not complete status */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTTaskModel"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{id}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Publish task to chat */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": number;
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{id}/attachassignee": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Attach assigne to task */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get history by task id */
        get: {
            parameters: {
                query?: {
                    filter?: string;
                    sort?: string;
                };
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UTTaskHistoryItemModel"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/files/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get file by id */
        get: {
            parameters: {
                query?: {
                    token?: string;
                };
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{id}/ical": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get history by task id */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": string;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Amount: {
            currencyCode?: string;
            amount?: string;
        };
        AmountFee: {
            currencyCode?: string;
            amount?: string;
        };
        AmountNet: {
            currencyCode?: string;
            amount?: string;
        };
        OrderAmount: {
            currencyCode?: string;
            amount?: string;
        };
        Payload: {
            /** Format: int64 */
            id?: number;
            number?: string;
            externalId?: string;
            customData?: string;
            orderAmount?: components["schemas"]["OrderAmount"];
            selectedPaymentOption?: components["schemas"]["SelectedPaymentOption"];
            /** Format: date-time */
            orderCompletedDateTime?: string;
        };
        ProblemDetails: {
            type?: string | null;
            title?: string | null;
            /** Format: int32 */
            status?: number | null;
            detail?: string | null;
            instance?: string | null;
        } & {
            [key: string]: unknown;
        };
        SelectedPaymentOption: {
            amount?: components["schemas"]["Amount"];
            amountFee?: components["schemas"]["AmountFee"];
            amountNet?: components["schemas"]["AmountNet"];
            exchangeRate?: string;
        };
        /** @enum {string} */
        UTActivationType: ActivationType;
        UTAreaModel: {
            name: string;
            id: string;
            projects?: components["schemas"]["UTProjectModel"][];
            smallFileId?: string;
        };
        UTBaseAreaModel: {
            name: string;
        };
        UTBaseProjectModel: {
            name?: string;
            description?: string;
            type?: components["schemas"]["UTProjectType"];
        };
        UTBaseTaskModel: {
            title: string;
            description?: string;
            type?: components["schemas"]["UTTaskType"];
            /** Format: date-time */
            dueDate?: string | null;
            /** Format: date-time */
            planDate?: string | null;
            planCron?: string;
            fromInline?: boolean;
            coassignees?: components["schemas"]["UTUserModel"][];
            status?: components["schemas"]["UTTaskStatus"];
            priority?: components["schemas"]["UTTaskPriority"];
            planDateNotifications?: number[];
            dueDateNotifications?: number[];
        };
        UTGroupModel: {
            taskGroups?: components["schemas"]["UTTaskGroupModel"][];
            areas?: components["schemas"]["UTAreaModel"][];
            projects?: components["schemas"]["UTProjectModel"][];
        };
        UTListTaskModel: {
            title: string;
            description?: string;
            type?: components["schemas"]["UTTaskType"];
            /** Format: date-time */
            dueDate?: string | null;
            /** Format: date-time */
            planDate?: string | null;
            planCron?: string;
            fromInline?: boolean;
            coassignees?: components["schemas"]["UTUserModel"][];
            status?: components["schemas"]["UTTaskStatus"];
            priority?: components["schemas"]["UTTaskPriority"];
            planDateNotifications?: number[];
            dueDateNotifications?: number[];
            author: components["schemas"]["UTUserModel"];
            projectName?: string | null;
            id: string;
            number?: string;
            isCompleted?: boolean;
            /** Format: date-time */
            endDate?: string | null;
            group?: string;
            completable?: components["schemas"]["UTTaskCompletableType"];
            completedUsers?: number[];
            /** Format: int32 */
            filesCount?: number;
        };
        /** @enum {string} */
        UTPaymentType: PaymentType;
        UTProfileModel: {
            id: string;
            userName: string;
            isStarted: boolean;
            role: string;
            roleTitle: string;
            /** Format: date-time */
            roleDate: string;
            /** Format: date-time */
            payDate?: string | null;
            smallFileId?: string | null;
            subscription: boolean;
            /** Format: double */
            rolePrice: number;
            currency?: string | null;
            rolePriceCode: string;
            version: string;
            defaultPaymentType?: components["schemas"]["UTPaymentType"];
            permissions: components["schemas"]["UTUserRolePermissionModel"][];
        };
        UTProjectModel: {
            name?: string;
            description?: string;
            type?: components["schemas"]["UTProjectType"];
            id: string;
            key?: string;
            /** Format: int64 */
            chatId?: number;
            smallFileId?: string | null;
            /** Format: int32 */
            position: number;
            used: boolean;
            /** Format: int32 */
            userCount: number;
            /** Format: int32 */
            openTaskCount: number;
        };
        /** @enum {string} */
        UTProjectType: ProjectType;
        UTRedeemModel: {
            author: components["schemas"]["UTUserModel"];
            code: string;
            type?: components["schemas"]["UTRedeemcodeType"];
            activated?: boolean;
            priceCode: string;
            activationType?: components["schemas"]["UTActivationType"];
        };
        /** @enum {string} */
        UTRedeemcodeType: RedeemcodeType;
        UTSettingsModel: {
            params?: components["schemas"]["UTSettingsParamModel"][];
        };
        UTSettingsParamModel: {
            code: string;
            enabled?: boolean;
            value?: unknown;
            defaultValue: unknown;
        };
        /** @enum {string} */
        UTTaskCompletableType: TaskCompletableType;
        UTTaskCounterModel: {
            code: string;
            name: string;
            /** Format: int32 */
            count: number;
            disabled?: boolean;
        };
        UTTaskFileModel: {
            id: string;
            /** Format: int32 */
            messageId: number;
            fileId: string;
            fileName: string;
            /** Format: int64 */
            chatId: number;
        };
        /** @enum {string} */
        UTTaskFilterType: TaskFilterType;
        UTTaskGroupModel: {
            code: string;
            name: string;
            /** Format: int32 */
            count: number;
            /** Format: int32 */
            urgent: number;
        };
        UTTaskHistoryCommentModel: {
            /** Format: int64 */
            chatId?: number;
            /** Format: int32 */
            messageId?: number;
            /** Format: int32 */
            replyToMessageId?: number;
            text?: string;
        };
        UTTaskHistoryItemModel: {
            author: components["schemas"]["UTUserModel"];
            /** Format: date-time */
            date: string;
            comment?: components["schemas"]["UTTaskHistoryCommentModel"];
            update?: components["schemas"]["UTTaskHistoryUpdateModel"];
        };
        UTTaskHistoryUpdateModel: {
            field?: string;
            oldValue?: unknown;
            newValue?: unknown;
        };
        UTTaskModel: {
            title: string;
            description?: string;
            type?: components["schemas"]["UTTaskType"];
            /** Format: date-time */
            dueDate?: string | null;
            /** Format: date-time */
            planDate?: string | null;
            planCron?: string;
            fromInline?: boolean;
            coassignees?: components["schemas"]["UTUserModel"][];
            status?: components["schemas"]["UTTaskStatus"];
            priority?: components["schemas"]["UTTaskPriority"];
            planDateNotifications?: number[];
            dueDateNotifications?: number[];
            author: components["schemas"]["UTUserModel"];
            project?: components["schemas"]["UTProjectModel"];
            id: string;
            number?: string;
            isCompleted?: boolean;
            /** Format: date-time */
            endDate?: string | null;
            completable?: components["schemas"]["UTTaskCompletableType"];
            completedUsers?: number[];
            files?: components["schemas"]["UTTaskFileModel"][];
            /** Format: int32 */
            lastMessageId?: number | null;
        };
        /** @enum {string} */
        UTTaskPriority: TaskPriority;
        /** @enum {string} */
        UTTaskStatus: TaskStatus;
        /** @enum {string} */
        UTTaskType: TaskType;
        UTUserModel: {
            /** Format: int64 */
            userId?: number;
            title?: string;
            userName?: string;
            smallFileId?: string | null;
            status?: components["schemas"]["UTUserStatus"];
        };
        UTUserRoleLabeledPriceModel: {
            code: string;
            /** Format: int32 */
            amount: number;
            /** Format: int32 */
            amountM: number;
            /** Format: int32 */
            amountY: number;
            /** Format: int32 */
            oldAmount: number;
            enabled: boolean;
        };
        UTUserRoleModel: {
            code: string;
            title: string;
            desciption: string;
            currency: string;
            /** Format: int32 */
            decimals: number;
            prices: components["schemas"]["UTUserRoleLabeledPriceModel"][];
            permissions: components["schemas"]["UTUserRolePermissionModel"][];
        };
        UTUserRolePermissionModel: {
            name: string;
            /** Format: int32 */
            value?: number | null;
            /** Format: int32 */
            used?: number | null;
        };
        /** @enum {string} */
        UTUserStatus: UserStatus;
        WalletResult: {
            /** Format: date-time */
            eventDateTime?: string;
            /** Format: int64 */
            eventId?: number;
            type?: string;
            payload?: components["schemas"]["Payload"];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type Amount = components['schemas']['Amount'];
export type AmountFee = components['schemas']['AmountFee'];
export type AmountNet = components['schemas']['AmountNet'];
export type OrderAmount = components['schemas']['OrderAmount'];
export type Payload = components['schemas']['Payload'];
export type ProblemDetails = components['schemas']['ProblemDetails'];
export type SelectedPaymentOption = components['schemas']['SelectedPaymentOption'];
export type _SchemaUtActivationType = components['schemas']['UTActivationType'];
export type AreaModel = components['schemas']['UTAreaModel'];
export type BaseAreaModel = components['schemas']['UTBaseAreaModel'];
export type BaseProjectModel = components['schemas']['UTBaseProjectModel'];
export type BaseTaskModel = components['schemas']['UTBaseTaskModel'];
export type GroupModel = components['schemas']['UTGroupModel'];
export type ListTaskModel = components['schemas']['UTListTaskModel'];
export type _SchemaUtPaymentType = components['schemas']['UTPaymentType'];
export type ProfileModel = components['schemas']['UTProfileModel'];
export type ProjectModel = components['schemas']['UTProjectModel'];
export type _SchemaUtProjectType = components['schemas']['UTProjectType'];
export type RedeemModel = components['schemas']['UTRedeemModel'];
export type _SchemaUtRedeemcodeType = components['schemas']['UTRedeemcodeType'];
export type SettingsModel = components['schemas']['UTSettingsModel'];
export type SettingsParamModel = components['schemas']['UTSettingsParamModel'];
export type _SchemaUtTaskCompletableType = components['schemas']['UTTaskCompletableType'];
export type TaskCounterModel = components['schemas']['UTTaskCounterModel'];
export type TaskFileModel = components['schemas']['UTTaskFileModel'];
export type _SchemaUtTaskFilterType = components['schemas']['UTTaskFilterType'];
export type TaskGroupModel = components['schemas']['UTTaskGroupModel'];
export type TaskHistoryCommentModel = components['schemas']['UTTaskHistoryCommentModel'];
export type TaskHistoryItemModel = components['schemas']['UTTaskHistoryItemModel'];
export type TaskHistoryUpdateModel = components['schemas']['UTTaskHistoryUpdateModel'];
export type TaskModel = components['schemas']['UTTaskModel'];
export type _SchemaUtTaskPriority = components['schemas']['UTTaskPriority'];
export type _SchemaUtTaskStatus = components['schemas']['UTTaskStatus'];
export type _SchemaUtTaskType = components['schemas']['UTTaskType'];
export type UserModel = components['schemas']['UTUserModel'];
export type UserRoleLabeledPriceModel = components['schemas']['UTUserRoleLabeledPriceModel'];
export type UserRoleModel = components['schemas']['UTUserRoleModel'];
export type UserRolePermissionModel = components['schemas']['UTUserRolePermissionModel'];
export type _SchemaUtUserStatus = components['schemas']['UTUserStatus'];
export type WalletResult = components['schemas']['WalletResult'];
export type $defs = Record<string, never>;
export const enum ActivationType {
    Redeem = "Redeem",
    Promocode = "Promocode"
}
export const enum PaymentType {
    MIR = "MIR",
    MC = "MC",
    Wallet = "Wallet",
    XTR = "XTR"
}
export const enum ProjectType {
    Private = "Private",
    Public = "Public",
    Dynamic = "Dynamic"
}
export const enum RedeemcodeType {
    Generic = "Generic",
    Gift = "Gift",
    HappyBirthday = "HappyBirthday",
    Admin = "Admin"
}
export const enum TaskCompletableType {
    Completable = "Completable",
    NotCompletable = "NotCompletable"
}
export const enum TaskFilterType {
    IsNotCompleted = "IsNotCompleted",
    IsCompleted = "IsCompleted",
    All = "All"
}
export const enum TaskPriority {
    None = "None",
    Lowest = "Lowest",
    Low = "Low",
    Medium = "Medium",
    High = "High",
    Highest = "Highest"
}
export const enum TaskStatus {
    New = "New",
    ToDo = "ToDo",
    InProgress = "InProgress",
    Resolved = "Resolved",
    Review = "Review",
    Approved = "Approved",
    Closed = "Closed"
}
export const enum TaskType {
    Task = "Task",
    Meet = "Meet"
}
export const enum UserStatus {
    None = "None",
    Creator = "Creator",
    Administrator = "Administrator",
    Member = "Member"
}
export type operations = Record<string, never>;
