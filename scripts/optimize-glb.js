
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, KHRTextureBasisu } from '@gltf-transform/extensions';
import { resample, prune, dedup, draco, textureCompress } from '@gltf-transform/functions';
import draco3d from 'draco3d';
import sharp from 'sharp';

// Register Extensions
const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression, KHRTextureBasisu])
    .registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(),
        'draco3d.encoder': await draco3d.createEncoderModule(),
    });

async function optimize() {
    const inputPath = 'public/custom-bugatti-bolide-concept-2020/source/Custom Bugatti Bolide Concept (2020).glb';
    const outputPath = 'public/custom-bugatti-bolide-concept-2020/source/bugatti-optimized.glb';

    console.log(`Reading ${inputPath}...`);
    const document = await io.read(inputPath);

    console.log('Optimizing...');
    await document.transform(
        // Resize Textures
        resample({ width: 1024, height: 1024 }),

        // Remove unused
        prune(),
        dedup(),

        // Compress Geometry (Draco)
        draco({ compressionLevel: 7 }),

        // Compress Textures (WebP or KTX2 - let's stick to Draco + Resize for now to avoid KTX complexity if sharp fails or basis is missing)
        // If user wanted KTX, we would use textureCompress({ encoder: sharp, targetFormat: 'webp' }) or similar.
        // For professional web, Resize is 90% of the win. Draco is the rest.
    );

    console.log(`Writing to ${outputPath}...`);
    await io.write(outputPath, document);
    console.log('Done!');
}

optimize().catch(err => console.error(err));
