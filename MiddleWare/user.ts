import * as crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as mysql from "mysql"; // mysql 모듈
import { dbconfig } from "../config/database";
import { secretObj } from "../config/jwt"; // jwt 비밀키
import {
  CollectionJSONArray,
  RoomJSON,
  UserJSON,
  loginJSON,
  registerJSON,
} from "../interface";
import { isAdmin } from "../util/admin"; // admin 판단을 위함
import { logs_ } from "../util/botplay";
import { check_id, check_name, check_pwd } from "../util/checker"; // 정규식 체크

const moment: any = require("moment");
require("moment-timezone");

moment.tz.setDefault("Asia/Seoul");

class user_ {
  connection: mysql.Connection;

  constructor() {
    this.connection = mysql.createConnection(dbconfig);
  }

  handle = () => {
    this.connection = mysql.createConnection(dbconfig);
  };

  connectCheck = (req: Request, res: Response, next: NextFunction) => {
    const self = this;
    this.connection.on("error", (err: mysql.MysqlError) => {
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        self.handle();
        next();
      } else {
        next();
      }
      next();
    });
    next();
  };

  getAll = (req: Request, res: Response, next: NextFunction) => {
    this.connection.query(
      "SELECT id, name, password, intro, favorite, deleted_day from Users",
      (error: mysql.MysqlError, rows: any) => {
        // sql 쿼리
        if (error) {
          // 에러 발생
          logs_(error.toString());
          res.status(404).end();
          return;
        }

        const raw_data: string = JSON.stringify(rows); // 가공 안된 데이터
        const data: Array<UserJSON> = JSON.parse(
          `[${raw_data.substring(1, raw_data.length - 1)}]`
        ); // json 배열 형태로 가공
        res.status(200).send(data); // 데이터 전송
      }
    );
  };

  login = (req: Request, res: Response, next: NextFunction) => {
    const data: loginJSON = {
      id: req.body.id,
      pwd: req.body.password,
    };

    if (!check_id(data.id) || !check_pwd(data.pwd)) {
      res.status(404).end();
      return;
    }
    try {
      this.connection.query(
        `SELECT password, salt, name, intro, favorite, deleted_day from Users WHERE id='${data.id}'`,
        (error: mysql.MysqlError, rows: any) => {
          if (error) {
            logs_(error.toString());
            res.status(404).end();
          }
          crypto.pbkdf2(
            data.pwd,
            rows[0].salt,
            126117,
            64,
            "sha512",
            (err: Error | null, key: Buffer) => {
              if (err) {
                res.status(404).end();
                return;
              }

              if (key.toString("base64") == rows[0].password) {
                const token: string = jwt.sign(
                  {
                    id: req.body.id,
                    admin: isAdmin(req.body.id),
                  },
                  secretObj.secret,
                  {
                    expiresIn: "30m",
                  }
                );

                const data: UserJSON = {
                  id: req.body.id,
                  name: rows[0].name,
                  intro: rows[0].intro,
                  favorite: rows[0].favorite,
                  deleted_day: rows[0].deleted_day,
                };

                res.cookie("user", token);

                res.status(200).send(data);
              } else {
                res.status(404).end();
              }
            }
          );
        }
      );
    } catch (e) {
      logs_(e as string);
      res.status(404).end();
    }
  };

  add = (req: Request, res: Response, next: NextFunction) => {
    const data: registerJSON = {
      id: req.body.id,
      pwd: req.body.password,
      name: req.body.name,
    };

    /// ////////정규식 체크(SQL Injection 방지)
    if (!check_id(data.id) || !check_pwd(data.pwd) || !check_name(data.name)) {
      res.status(404).end();
      return;
    }

    // 32바이트의 랜덤 문자열 생성(salt)
    crypto.randomBytes(32, (err: Error | null, buf: Buffer) => {
      // salt를 이용한 pwd 암호화
      crypto.pbkdf2(
        data.pwd,
        buf.toString("base64"),
        126117,
        64,
        "sha512",
        (err: Error | null, key: Buffer) => {
          const en_pwd: string = key.toString("base64"); // 암호화한 pwd

          const salt: string = buf.toString("base64"); // 랜덤 문자열 salt

          const into_data: string[] = [data.id, en_pwd, data.name, salt];

          const sql: string =
            "INSERT INTO Users (id, password, name, salt) VALUES(?, ?, ?, ?)";

          this.connection.query(
            sql,
            into_data,
            (err: mysql.MysqlError | null, results: any) => {
              if (err) {
                res.status(404).end();
                logs_(err.toString());
              } else {
                res.status(200).end();
              }
            }
          );
        }
      );
    });
  };

  getMyInfo = (req: Request, res: Response, next: NextFunction) => {
    const { id } = res.locals;
    if (!check_id(id)) {
      res.status(404).end();
      return;
    }

    this.connection.query(
      `SELECT id,name,intro,favorite,deleted_day from Users WHERE id='${id}'`,
      (error: mysql.MysqlError, rows: any) => {
        if (error) {
          logs_(error.toString());
          res.status(404).end();
        }

        const raw_data: string = JSON.stringify(rows);
        const data: UserJSON = JSON.parse(
          raw_data.substring(1, raw_data.length - 1)
        );
        if (data.deleted_day != null) {
          res.status(404).end();
          return;
        }

        res.status(200).send(data);
      }
    );
  };

  getCollection = (req: Request, res: Response, next: NextFunction) => {
    const { id } = res.locals;
    this.connection.query(
      `SELECT rec.seq ,rec.recipeName, rec.rarity, rec.summary,rec.path ,c.Date FROM Recipe AS rec JOIN Collection AS c ON c.rec_num = rec.seq AND c.id = '${id}'`,
      (error: mysql.MysqlError, rows: any) => {
        if (error) {
          logs_(error.toString());
          res.status(404).end();
          return;
        }

        const raw_data: string = JSON.stringify(rows);
        const data: CollectionJSONArray = JSON.parse(
          `{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)}]}`
        );

        res.status(200).send(data);
      }
    );
  };

  addCollection = (req: Request, res: Response, next: NextFunction) => {
    const Recipe_seq: number = +req.params.cId; // 추가할 레시피 seq
    const { id } = res.locals;
    this.connection.query(
      `SELECT * FROM Collection WHERE id='${id}' AND rec_num=${Recipe_seq}`,
      (error: mysql.MysqlError, rows: any) => {
        if (rows.length != 0 || error) {
          res.status(404).end();
          return;
        }
        this.connection.query(
          `INSERT INTO Collection (id, rec_num, Date) VALUES ('${id}', ${Recipe_seq}, '${moment().format(
            "YYYY-MM-DD HH:mm:ss"
          )}')`,
          (error: mysql.MysqlError, rows: any) => {
            if (error) {
              res.status(404).end();
              return;
            }
            res.status(200).end();
          }
        );
      }
    );
  };

  addNewRoom = (req: Request, res: Response, next: NextFunction) => {
    const input: RoomJSON = {
      title: req.body.title,
      id: res.locals.id,
      date: moment().format("YYYY-MM-DD HH:mm:ss"),
      Data: JSON.stringify(req.body.data),
    };
    try {
      this.connection.query(
        `INSERT INTO RoomInfo (title, id, date, Data) VALUES ('${input.title}', '${input.id}', '${input.date}', '${input.Data}')`,
        (err: mysql.MysqlError, rows: any) => {
          if (err) {
            res.status(404).end();
            logs_(err.toString());
            return;
          }

          res.status(200).end();
        }
      );
    } catch (e) {
      res.status(404).end();
    }
  };

  getMyRoom = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals;
      this.connection.query(
        `SELECT seq, title, date, Data FROM RoomInfo WHERE id='${id}'`,
        (err: mysql.MysqlError, rows: any) => {
          if (err) {
            res.status(404).end();
            return;
          }

          if (rows.length == 0) {
            res.status(204).end();
            return;
          }

          const data: any = JSON.parse(JSON.stringify(rows));

          for (let i: number = 0; i < data.length; i++) {
            data[i].Data = JSON.parse(data[i].Data);
          }

          res.status(200).send(data);
        }
      );
    } catch (e) {
      logs_(e as string);
      res.status(404).end();
    }
  };

  updateRoom = (req: Request, res: Response, next: NextFunction) => {
    try {
      this.connection.query(
        `UPDATE RoomInfo SET Data='${JSON.stringify(
          req.body.Data
        )}' WHERE seq='${req.params.seq}' AND id='${res.locals.id}'`
      );
      res.status(200).end();
      return;
    } catch (e) {
      logs_(e as string);
      res.status(404).end();
    }
  };
}

export const user = new user_();
