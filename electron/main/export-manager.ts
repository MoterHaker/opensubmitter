import fs from "fs"
/// <reference path="../../src/type.d.ts" />

export default class ExportManager {
    fields: string[] = []
    storage: object[] = []

    store(result: TemplateResult) {
        this.fields = result.fields;
        this.storage.push(result.values);
    }

    export(format: ExportFormat, fileName: string): number {

        let output = '';

        switch (format) {
            case 'CSV':
                if (this.fields.length === 0) throw new Error('Fields are required for CSV format.');
                output += this.fields.join(',') + '\n';
                this.storage.forEach(obj => {
                    output += this.fields.map(field => obj[field]).join(',') + '\n';
                });
                break;
            case 'JSON':
                output = JSON.stringify(this.storage, null, 4);
                break;
            case 'SQL':
                if (this.fields.length === 0) throw new Error('Fields and tableName are required for SQL format.');
                this.storage.forEach(obj => {
                    let values = this.fields.map(field => `'${this.escapeSqlInput(obj[field])}'`).join(',');
                    output += `INSERT INTO data_table (${this.fields.join(', ')}) VALUES (${values});\n`;
                });
                break;
            case 'MongoDB':
                if (this.fields.length === 0) throw new Error('Fields and tableName are required for MongoDB format.');
                this.storage.forEach(obj => {
                    let fieldData = this.fields.map(field => `  "${field}": "${obj[field]}"`).join(',\n');
                    output += `db.data_table.insert({\n${fieldData}\n});\n`;
                });
                break;
        }

        fs.writeFileSync(fileName, output);

        return this.storage.length;
    }

    escapeSqlInput(value) {
        if (typeof value !== 'string') {
            return value;
        }
        return value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\" + char; // prepends a backslash to quotes, backslash, and percent
                default:
                    return char;
            }
        });
    }
}