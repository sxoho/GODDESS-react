// src/components/fitting/ModelViewer3D.tsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage } from '@react-three/drei';

interface ModelViewerProps {
    modelUrl: string;
}

const Model = ({ url }: { url: string }) => {
    // 3D 모델(.glb) 파일을 비동기로 로드
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
};

const ModelViewer3D: React.FC<ModelViewerProps> = ({ modelUrl }) => {
    return (
        <div className="canvas-container">
            <Canvas shadows camera={{ position: [0, 0, 150], fov: 40 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6}>
                        <Model url={modelUrl} />
                    </Stage>
                </Suspense>
                {/* 마우스/터치로 360도 회전, 확대/축소 지원 */}
                <OrbitControls makeDefault />
            </Canvas>
        </div>
    );
};

export default ModelViewer3D;