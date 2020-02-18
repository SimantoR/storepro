export { }

import 'datejs';

declare global {
    interface Date {
        toStandardFormat: () => string;
    }
}

Date.prototype.toStandardFormat = function () {
    return this.toString(`yyyy-MM-dd hh:mm:ss`)
}