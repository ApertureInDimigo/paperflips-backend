import {Request, Response, NextFunction} from 'express'

export const bot_check = (req:Request, res:Response, next:NextFunction) => {
    res.status(200).end();
}