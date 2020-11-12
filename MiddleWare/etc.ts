import {Request, Response} from 'express';

export let privacy = (req:Request, res:Response) => {
    res.render('privacy.html')
}

export let robot = (req:Request, res:Response) => {
    res.type("text/plain")
    res.send("User-agent: *\nDisallow: /");
 }