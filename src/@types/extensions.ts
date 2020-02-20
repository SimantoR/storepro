export {};

import 'datejs';

declare global {
  interface Date {
    toStandardFormat(): string;
    toDatabaseString(): string;
    toUTCDate(): string;
  }
}

Date.prototype.toStandardFormat = function() {
  return this.toString(`yyyy-MM-dd HH:mm:ss`);
};

Date.prototype.toDatabaseString = function() {
  const yyyy = this.getUTCFullYear();
  const MM = (this.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = this.getUTCDate()
    .toString()
    .padStart(2, '0');
  const HH = this.getUTCHours()
    .toString()
    .padStart(2, '0');
  const mm = this.getUTCMinutes()
    .toString()
    .padStart(2, '0');
  const ss = this.getUTCSeconds()
    .toString()
    .padStart(2, '0');
  const ms = this.getUTCMilliseconds()
    .toString()
    .padEnd(3, '0');

  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
};

Date.prototype.toUTCDate = function() {
  const yyyy = this.getUTCFullYear();
  const MM = (this.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = this.getUTCDate()
    .toString()
    .padStart(2, '0');
  return `${yyyy}-${MM}-${dd}`;
};
