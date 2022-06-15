import {badwordsEN} from "./badwords.js";

function containsProfanity(word){
    let lowercaseword = word.toLowerCase();
    for (let badword of badwordsEN){
        if (lowercaseword.includes(badword)){
            return true;
        }
    }
    return false;
}

export{containsProfanity};