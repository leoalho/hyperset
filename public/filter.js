import {badwordsEN} from "./badwords.js";

function containsProfanity(word){
    let lowercaseword = word.toLowerCase();
    for (let badword of badwordsEN){
        console.log(badword);
        if (lowercaseword.includes(badword)){
            return true;
        }
    }
    return false;
}

export{containsProfanity};