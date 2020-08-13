"use strict";
exports.__esModule = true;
exports.isAdmin = void 0;
function isAdmin(input) {
    var adminList = new Array("minsoo0715");
    if (adminList.indexOf(input) == -1)
        return false;
    else
        return true;
}
exports.isAdmin = isAdmin;
