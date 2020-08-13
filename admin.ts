export function isAdmin(input:string) {
    let adminList:Array<string> = new Array<string>(
        "minsoo0715"
        );
    
    if(adminList.indexOf(input) == -1) return false;
    else return true;
}


