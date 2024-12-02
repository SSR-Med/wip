/*
    This helper function checks if the input is a number or not
    It returns true if the input is a number and false if it is not
*/
export function isNumber(number: string){
    if(number == "") return false;
    const numberList = number.split(" ");
    if(numberList.length < 2) return false;
    try{
        parseFloat(numberList[0]);
        return true
    }
    catch(error){
        return false;
    }
}