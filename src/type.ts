export interface InterestByRegionWidget {
    request: {
        resolution: string;
        includeLowSearchVolumeGeos: boolean;
    };
    token: string;
}

export const intByRegionWidgetInitial: InterestByRegionWidget = {
    request: {
        resolution: "COUNTRY",
        includeLowSearchVolumeGeos: false,
    },
    token: ""
};