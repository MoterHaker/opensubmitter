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
                    let values = this.fields.map(field => `'${obj[field]}'`).join(',');
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
}