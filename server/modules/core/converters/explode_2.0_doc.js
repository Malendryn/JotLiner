
// explode contents of docstream into a dict (see bem_core_DocExporter.js for dict construction)
export async function explode(dict) {  // see bem_core_DocExploder.js for definition of dict
    debugger;
    const doc = new TextDecoder().decode(dict.doc);   // doc always is Uint8array,  so for v1.0 we must convert back to textual
    delete dict.doc;                            // reduce mem usage

    let dimp = new DocImporter();
    const dic2 = await dimp.import(doc);
    dic2.name = "";                             // v1.0 has no name
//    dic2.upgraded = true; // was NOT Upgraded, this IS current version!
    return dic2;
}
