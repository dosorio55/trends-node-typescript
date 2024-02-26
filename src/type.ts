export interface InterestByRegionWidget {
    request: {
        resolution: string;
        includeLowSearchVolumeGeos: boolean;
    };
    token: string | null;
}

export const intByRegionWidgetInitial: InterestByRegionWidget = {
    request: {
        resolution: "COUNTRY",
        includeLowSearchVolumeGeos: false,
    },
    token: null
};

/**
 * Related queries interfaces
 */
interface HelpDialog {
    title: string;
    content: string;
    url: string;
}

interface Request {
    restriction: any;
    keywordType: string;
    metric: any[];
    trendinessSettings: any;
    requestOptions: any;
    language: string;
    userCountryCode: string;
    userConfig: any;
}

export interface RelatedQueries {
    request: Request;
    helpDialog: HelpDialog;
    color: string;
    keywordName: string;
    token: string;
    id: string;
    type: string;
    title: string;
    template: string;
    embedTemplate: string;
    version: string;
    isLong: boolean;
    isCurated: boolean;
}