
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { prune, dedup, draco } from '@gltf-transform/functions';
import draco3d from 'draco3d';

// Register Extensions
const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(),
        'draco3d.encoder': await draco3d.createEncoderModule(),
    });

async function optimize() {
    const inputPath = 'public/custom-bugatti-bolide-concept-2020/source/Custom Bugatti Bolide Concept (2020).glb';
    const outputPath = 'public/custom-bugatti-bolide-concept-2020/source/bugatti-hq-draco.glb';

    console.log(`Reading ${inputPath}...`);
    const document = await io.read(inputPath);

    console.log('Optimizing (High Quality - Draco Geometry Only)...');
    await document.transform(
        // Clean up unused data
        prune(),
        dedup(),

        // Compress Geometry ONLY (Draco) - This moves parsing to worker thread
        // We DO NOT resize textures here.
        draco({ compressionLevel: 7 })
    );

    console.log(`Writing to ${outputPath}...`);
    await io.write(outputPath, document);
    console.log('Done!');
}

optimize().catch(err => console.error(err));
