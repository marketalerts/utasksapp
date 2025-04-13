import { writeFile } from 'fs/promises';
import { log } from 'console';

import ts from 'typescript';
import generateFromOpenAPI, { astToString } from 'openapi-typescript';

import { backendUrlKey, options } from './firebase-env.js';
import { fetchConfig } from './firebase-config.js';

const config = await fetchConfig(options());
const backendUrl = config.entries[backendUrlKey];
const swaggerStub = 'swagger/v1/swagger.json';
const openapiLink = [backendUrl, swaggerStub].join('/');

log('🏭 Generating schema from', openapiLink);

let lastEnumPath;
const createTypeAliasDeclaration =  ts.factory.createTypeAliasDeclaration;
const createEnumDeclaration =  ts.factory.createEnumDeclaration;

// Prevent enum duplication when using both 'enum' and 'rootTypes' flags
ts.factory.createTypeAliasDeclaration = function (modifiers, name, typeParameters, type) {
  if (name.startsWith('SchemaUt') && ts.isTypeReferenceNode(type)) {
    if (lastEnumPath.every(part => type.typeName.escapedText.includes(part))) {
      // TODO?
      // ts.factory.createJSDocComment('@alias ' + name.replace('SchemaUt', 'UT'));
      return createTypeAliasDeclaration(modifiers, '_' + name, typeParameters, type);
    }

    return createTypeAliasDeclaration(modifiers, name.replace('SchemaUt', ''), typeParameters, type);
  }
  if (name.startsWith('Schema')) {
    return createTypeAliasDeclaration(modifiers, name.replace('Schema', ''), typeParameters, type);
  }

  return createTypeAliasDeclaration(...arguments);
};

ts.factory.createEnumDeclaration = function (modifiers, name, members) {
  if (name.startsWith('UT')) {
    return createEnumDeclaration(
      [...modifiers, ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)],
      name.replace('UT', ''),
      members
    );
  }
};

const schema = astToString(await generateFromOpenAPI(openapiLink, {
  enum: true,
  rootTypes: true,
  transform(schema, options) {
    if ('enum' in schema) {
      lastEnumPath = options.path.split('/').slice(1);
    }

    return undefined;
  },
}));

ts.factory.createTypeAliasDeclaration = createTypeAliasDeclaration;
ts.factory.createEnumDeclaration = createEnumDeclaration;

await writeFile('./src/legacy/features/_shared/network/schema.ts', schema);

log('✅ Done');
