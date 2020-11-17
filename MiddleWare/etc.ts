import {Request, Response} from 'express';
import path from 'path'

export let privacy = (req:Request, res:Response) => {
    res.sendFile( path.resolve("public", "privacy.html"));
    //res.render('privacy.html'/..)
}

export let robot = (req:Request, res:Response) => {
    res.type("text/plain")
    res.send("User-agent: *\nDisallow: /");
 }