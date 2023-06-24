import { NextFunction, Request, Response } from "express";
import * as mysql from "mysql"; //mysql 모듈
import path from "path";
import { S3_server } from "../Image_Server/S3_handler";
import { dbconfig } from "../config/database";
import {
  AllRecipeJSON,
  FileJSON,
  RecipeDetail,
  RecipeJSON,
} from "../interface";
import { logs_ } from "../util/botplay";
import { check_name, check_number } from "../util/checker";

class _recipe {
  connection: mysql.Connection;
  constructor() {
    this.connection = mysql.createConnection(dbconfig);
  }
  handle = () => {
    this.connection = mysql.createConnection(dbconfig);
  };

  connectCheck = (req: Request, res: Response, next: NextFunction) => {
    const self = this;
    this.connection.on(`error`, function (err: mysql.MysqlError) {
      if (err.code === `PROTOCOL_CONNECTION_LOST`) {
        self.handle();
        next();
      } else {
        next();
      }
      next();
    });
    next();
  };

  get = (req: Request, res: Response, next: NextFunction) => {
    const seq: string = req.params.seq;

    if (!check_number(seq)) {
      res.status(404).end();
      return;
    }
    try {
      this.connection.query(
        `SELECT recipeName,rarity,summary from Recipe WHERE seq='${seq}'`,
        (error: mysql.MysqlError, rows: any) => {
          if (error) {
            logs_(error.toString());
            res.status(404).end();
            return;
          }
          const obj: string = JSON.stringify(rows);

          const obj2: any = JSON.parse(
            `{"data": ${obj.substring(1, obj.length - 1)}}`
          );

          res.status(200).send(obj2);
          return;
        }
      );
    } catch (e) {
      logs_(e as string);
      res.status(404).end();
      return;
    }
  };

  upload = (req: Request, res: Response, next: NextFunction) => {
    const host: string = `https://paperflips.s3.amazonaws.com`;

    const data: RecipeJSON = {
      //업로드 데이터
      recipeName: req.body.recipeName,
      rarity: req.body.rarity,
      summary: req.body.summary,
    };
    if (
      !check_name(data.recipeName) ||
      !check_name(data.rarity) ||
      !check_name(data.summary)
    ) {
      res.status(404).end();
      return;
    }

    this.connection.query(
      `INSERT INTO Recipe (recipeName, rarity, summary) VALUES ('${data.recipeName}', '${data.rarity}', '${data.summary}'); 
                             SELECT LAST_INSERT_ID();
           `,
      (error: mysql.MysqlError, rows: any) => {
        if (error) {
          //sql error 발생.. connection.on으로 에러 핸들링 예정
          logs_(error.toString());
          res.status(404).end();
          return;
        }
        const raw_data: string = JSON.stringify(rows); //sql raw data
        const data: any = JSON.parse(raw_data); //JSON 형식으로 변경
        const seq: string = JSON.stringify(data[1][0][`LAST_INSERT_ID()`]); //입력한 파일의 SEQ를 받아옴

        const result: FileJSON = {
          //업로드 파일 관련 메타데이터
          originalname: req.file.originalname,
          size: req.file.size,
        };

        const image_server = new S3_server();
        image_server.recipe_upload(seq, result.originalname); //recipe_img 디렉토리에 파일을 업로드 함..
        this.connection.query(
          `UPDATE Recipe SET path='${host}/recipe_img/${seq}${path.extname(
            req.file.originalname
          )}' WHERE seq='${seq}'`
        ); //업로드 한 파일의 s3 경로를 받아옴
        res.status(200).end(); //성공
        return;
      }
    );
  };

  search = (req: Request, res: Response, next: NextFunction) => {
    const recipe: any = req.query.q;

    if (!check_name(recipe)) {
      res.status(404).end(); //SQL INJECTION 방지를 위한 정규식 체크
      return;
    }

    try {
      this.connection.query(
        `SELECT seq, recipeName, rarity, summary from Recipe WHERE recipeName LIKE '%${recipe}%'`,
        (error: mysql.MysqlError, rows: any) => {
          //LIKE를 이용해 검색
          if (error) {
            //에러 발생
            logs_(error.toString());
            res.status(404).end(); //404
            return;
          }
          if (rows.length == 0) {
            res.status(404).end(); //404
            return;
          }
          const raw_data: string = JSON.stringify(rows);
          const data: any = JSON.parse(
            `{ "data" : [ ${raw_data.substring(
              1,
              raw_data.length - 1
            )}] , "length" : ${rows.length}}`
          ); //데이터 가공
          res.status(200).send(data);
          return;
        }
      );
    } catch (e) {
      logs_(e as string);
      res.status(404).end(); // 실패, 에러
      return;
    }
  };

  getAll = (req: Request, res: Response, next: NextFunction) => {
    try {
      this.connection.query(
        `SELECT seq, recipeName,rarity,summary,path from Recipe`,
        (error: mysql.MysqlError, rows: any) => {
          //쿼리
          if (error) {
            // 에러
            logs_(error.toString());

            res.status(404).end(); // 실패
            return;
          }
          const raw_data: string = JSON.stringify(rows);
          const data: AllRecipeJSON = JSON.parse(
            `{ "data" : [ ${raw_data.substring(
              1,
              raw_data.length - 1
            )} ], "length" : ${rows.length}}`
          ); //데이터 가공

          res.status(200).send(data); // 성공
        }
      );
    } catch (e) {
      logs_(e as string);
      res.status(404).end(); //실패 , 에러
      return;
    }
  };

  addDetail = (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: RecipeDetail = {
        recipeName: req.params.recipeName,
        detail: req.body.detail,
        VidPath: req.body.VidPath,
        ImgPath: req.body.ImgPath,
      };
      this.connection
        .query(`INSERT INTO Recipe_Detail (recipeName, detail, VidPath, ImgPath) 
            VALUES ('${data.recipeName}', '${data.detail}', '${data.VidPath}', '${data.ImgPath}')`);
      res.status(200).end();
    } catch (e) {
      logs_(e as string);
      res.status(404).end();
      return;
    }
  };

  getDetail = (req: Request, res: Response, next: NextFunction) => {
    try {
      this.connection.query(
        `SELECT * FROM Recipe_Detail WHERE recipeName='${req.params.recipeName}'`,
        (error: mysql.MysqlError, rows: any) => {
          res.status(200).send(rows[0]);
          return;
        }
      );
    } catch (e) {
      logs_(e as string);
      res.status(404).end();
    }
  };
}

export const recipe = new _recipe();
