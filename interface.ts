export interface registerJSON extends loginJSON{
     name : string 
}

export interface loginJSON{
    id:string,
    pwd:string
}

export interface RoomJSON{
    title:string,
    id:string,
    date:string,
    Data:string|null
}

export interface UserJSON{
    id:string,
    name:string,
    intro:string|null,
    favorite:string|null,
    deleted_day:string|null
}

export interface FileJSON{
    originalname:string,
    size:number
}

export interface RecipeJSON{
    recipeName:string,
    rarity:string,
    summary:string
}

export interface CollectionJSON extends RecipeJSON{
   seq:string,
   path:string,
   Date:string
}

export interface CollectionJSONArray {
    data : Array<CollectionJSON>
}

export interface RecipeDetail{
    recipeName:string,
    detail:string,
    VidPath:string,
    ImgPath:string
}

export interface Saved_RecipeJSON extends RecipeJSON{
  seq:number,
  path:string|null
}

export interface AllRecipeJSON{
    data: Array<Saved_RecipeJSON>,
    length: number;
}