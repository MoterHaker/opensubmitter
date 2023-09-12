
class NamesGenerator {

    electronAssetsDirectory: string;
    extraFemaleNames: string[] = [];
    extraMaleNames: string[] = [];
    extraSurnames: string[] = [];

    generatePassword(withSpecial: boolean, withNumbers: boolean): string {
        const letters = 'qwertyuiopasdfghjklzxcvbnm1234567890';
        const upper = 'QWERTYUIOPASDFGHJKLZXCVBNM';
        const numbers = '1234567890';
        const result = [];
        for (let i = 0; i<12;i++) {
            result.push(letters[Math.floor(Math.random()*letters.length)]);
        }
        if (withSpecial) {
            const special = '@!#%_-';
            for (let i = 0; i < 5; i++) {
                result.push(special[Math.floor(Math.random() * special.length)]);
            }
        }
        for (let i = 0; i<5;i++) {
            result.push(upper[Math.floor(Math.random()*upper.length)]);
        }
        if (withNumbers) {
            for (let i = 0; i<5;i++) {
                result.push(numbers[Math.floor(Math.random()*numbers.length)]);
            }
        }
        return (this.shuffleArray(result) as string[]).join("");
    }


    generateUserName(length: number, withNumbers: boolean) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];

        let result = '';
        let currentIsVowel = Math.random() < 0.5; // Randomly determine if we start with a vowel

        for (let i = 0; i < length; i++) {
            const currentList = currentIsVowel ? vowels : consonants;
            const randomIndex = Math.floor(Math.random() * currentList.length);
            result += currentList[randomIndex];

            currentIsVowel = !currentIsVowel; // Switch between vowel and consonant
        }
        if (withNumbers) {
            const numbersLength = Math.floor(Math.random() * 3) + 1;
            const numbers = '1234567890';
            for (let i = 0; i<numbersLength;i++) {
                result += numbers[Math.floor(Math.random()*numbers.length)];
            }
        }

        return result;
    }

    capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    shuffleArray(array: any[]): any[] {
        for (let i = array.length - 1; i > 0; i--) {
            // Generate a random index between 0 and i (inclusive)
            const j = Math.floor(Math.random() * (i + 1));

            // Swap elements at indices i and j
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getRandomName(requirements: GeneratedPersonRequirements): GeneratedPerson {

        console.log('this.electronAssetsDirectory', this.electronAssetsDirectory);
        if (this.extraFemaleNames.length === 0) {
            const fs = require("fs");
            const path = require("path");
            this.extraMaleNames = fs.readFileSync(path.join(this.electronAssetsDirectory, 'males.txt')).toString().toLowerCase().split("\n");
            this.extraFemaleNames = fs.readFileSync(path.join(this.electronAssetsDirectory, 'females.txt')).toString().toLowerCase().split("\n");
            this.extraSurnames = fs.readFileSync(path.join(this.electronAssetsDirectory, 'surnames.txt')).toString().toLowerCase().split("\n");
        }

        let isMale = true;
        if (requirements.randomGender === true) {
            isMale = Math.random() > 0.5
        }

        return {
            name: this.capitalizeFirst(isMale ? this.extraMaleNames[Math.floor(Math.random()*this.extraMaleNames.length)] :
                this.extraFemaleNames[Math.floor(Math.random()*this.extraFemaleNames.length)]),
            surname: this.capitalizeFirst(this.extraSurnames[Math.floor(Math.random()*this.extraSurnames.length)]),
            username: this.generateUserName(typeof requirements.minimumUsernameLength !== "undefined" ? requirements.minimumUsernameLength : 10,
                typeof requirements.usernameWithANumber !== "undefined" ? requirements.usernameWithANumber : true),
            password: this.generatePassword(true, true)
        }

    }
}