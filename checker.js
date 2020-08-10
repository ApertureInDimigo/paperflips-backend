"use strict";
exports.__esModule = true;
exports.check = exports.check_name = exports.check_pwd = exports.check_id = void 0;
var exp = /^[0-9]+$/;
var exp_id = /^[A-Za-z0-9]{6,12}$/;
var exp_name = /^[A-Z0-9a-z가-힣]+$/;
var exp_pwd = /^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/; //8~15자리 
function check_id(object) {
    return exp_id.test(object);
}
exports.check_id = check_id;
function check_pwd(object) {
    return exp_pwd.test(object);
}
exports.check_pwd = check_pwd;
function check_name(object) {
    return exp_name.test(object);
}
exports.check_name = check_name;
function check(object) {
    return exp.test(object);
}
exports.check = check;
