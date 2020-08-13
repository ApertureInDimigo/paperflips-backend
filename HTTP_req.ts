export let stat:Map<number, JSON> = new Map([
    [404, JSON.parse(`{ "status" : 404}`)],
    [403, JSON.parse(`{ "status" : 403}`)],
    [200, JSON.parse(`{ "status" : 200}`)]
]);

