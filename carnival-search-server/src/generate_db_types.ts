import fs from 'fs/promises';
import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';
import * as schema from "./db/schema";
import * as ts_types from "./types";

async function generateFrontendTypes() {
    const project = new Project({
        compilerOptions: {
            strictNullChecks: true
        }
    });
    const source_file = project.addSourceFileAtPath(path.join(__dirname, 'db_types.ts'));
    const type_aliases = source_file.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);
    const types = type_aliases
        .map(type_alias => {
            const name = type_alias.getName().replace('$inferSelect', '');
            const type = type_alias.getType();
            const properties = type.getProperties();

            const propertyStrings = properties.filter(prop => !prop.getName().includes("password")).map(prop => {
                const propType = prop.getTypeAtLocation(type_alias);
                let type_name = propType.getText();
                if (propType.getText().startsWith('import(')) {
                    let enum_array = false;
                    let enum_name = propType.getText().split('.')[1];
                    if (enum_name.endsWith('[]')) {
                        enum_name = enum_name.slice(0, -2);
                        enum_array = true;
                    }
                    if ((schema as any)[enum_name]) {
                        const enum_values = Object.values((schema as any)[enum_name]);
                        type_name = enum_array ? `Array<${enum_values.map(value => `"${value}"`).join(' | ')}>` : enum_values.map(value => `"${value}"`).join(' | ');
                    } else if ((ts_types as any)[enum_name]) {
                        const enum_values = Object.values((ts_types as any)[enum_name]);
                        type_name = enum_array ? `Array<${enum_values.map(value => `"${value}"`).join(' | ')}>` : enum_values.map(value => `"${value}"`).join(' | ');
                    }
                }
                return `    ${prop.getName()}: ${type_name};`;
            });

            return `export type ${name} = {\n${propertyStrings.join('\n')}\n};`;
        });

    const frontend_declarations = [...types];
    const outputPath = path.join(__dirname, 'generated_types.ts');
    await fs.writeFile(outputPath, frontend_declarations.join('\n\n'));

    console.log(`Frontend types generated`);
}

generateFrontendTypes().catch(console.error);