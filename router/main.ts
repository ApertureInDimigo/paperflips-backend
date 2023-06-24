import express from "express";
import { privacy, robot } from "../MiddleWare/etc";
import UserRouter from "./User";
import RecipeRouter from "./recipe";
const cache = require("apicache").middleware;

const router = express.Router();

router.use("/User", UserRouter); //유저 관련 라우터

router.use("/rec", RecipeRouter); //레시피 관련 라우터

router.get("/privacy", cache("60 minutes"), privacy); //개인정보 취급 방침

router.get("/robots.txt", cache("60 minutes"), robot); //검색 엔진 접근 권한

export default router;
