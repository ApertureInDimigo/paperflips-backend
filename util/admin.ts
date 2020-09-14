export function isAdmin(input:string) {
    let adminList:Array<string> = new Array<string>(
        "minsoo0715",
        "ruadl034",
        "qeqwqeq1",
        "mj2044001",
        "hodudragon0405"
        );
    
    if(adminList.indexOf(input) == -1) return false;
    else return true;
}


