import { Request, Response } from "express";
import path from "path";

export const privacy = (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "privacy.html"));
  //res.render('privacy.html'/..)
};

export const robot = (req: Request, res: Response) => {
  res.type("text/plain");
  res.send("User-agent: *\nDisallow: /");
};
