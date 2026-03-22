import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styled from 'styled-components'

const Container = styled.div`
  --display-shader: block;

  @media (max-width: 768px) {
    --display-shader: none;
  }
`;

const ScrollShaderOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    const state = useRef({
        velocity: 0,
        time: 0,
        mouse: new THREE.Vector2(0.5, 0.5),
        targetMouse: new THREE.Vector2(0.5, 0.5)
    });

    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        const geometry = new THREE.PlaneGeometry(2, 2);
        const uniforms = {
            uTime: { value: 0 },
            uVelocity: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        };

        const material = new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.NormalBlending,
            uniforms,
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float uTime;
        uniform float uVelocity;
        uniform vec2 uMouse;
        varying vec2 vUv;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123); }

        void main() {
          // 1. 속도 기반 어둠 강도 (vel)
          float vel = clamp(abs(uVelocity) * 1.5, 0.0, 1.5);
          vec2 uv = vUv;
          
          // 2. 마우스 하이라이트 영역
          float dist = distance(uv, uMouse);
          float scatterRadius = 0.28; 
          float scatterStrength = smoothstep(scatterRadius, 0.0, dist);
          
          // 3. 컬러 로직: [핵심] 회색조 어둠 구현
          // 완전 블랙(0.0) 대신 짙은 회색(0.2)을 사용하여 채도를 부드럽게 누릅니다.
          vec3 mutedDarkGrey = vec3(0.01); 
          vec3 mouseColor = vec3(1.0); // 마우스 주변은 여전히 밝게
          
          // 스크롤 시 어두운 회색이 나타나고 마우스가 있는 곳만 밝게 믹스
          vec3 finalColor = mix(mutedDarkGrey, mouseColor, scatterStrength);
          
          // 마우스 주변 픽셀 산란 노이즈
          float grain = hash(uv * 1000.0 + uTime) * scatterStrength * 0.25;
          finalColor += grain;

          // 4. 알파 제어
          // 스크롤 시 화면 전체가 차분하게 회색조로 가라앉도록 설정 (최대 0.6)
          float scrollDarkness = smoothstep(0.0, 1.0, vel) * 0.6;
          float finalAlpha = max(scrollDarkness, scatterStrength * 0.4);
          
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const handleMouseMove = (e: MouseEvent) => {
            state.current.targetMouse.x = e.clientX / window.innerWidth;
            state.current.targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
        };

        const handleWheel = (e: WheelEvent) => {
            // 0.002에서 0.001로 감도를 살짝 낮춰서 더 묵직하게 어두워지도록 설정
            state.current.velocity += e.deltaY * 0.001;
        };

        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('wheel', handleWheel, { passive: true });
        window.addEventListener('resize', handleResize);

        const animate = (t: number) => {
            state.current.time = t * 0.001;

            state.current.velocity *= 0.9675;
            state.current.mouse.lerp(state.current.targetMouse, 0.07);

            uniforms.uTime.value = state.current.time;
            uniforms.uVelocity.value = state.current.velocity;
            uniforms.uMouse.value.copy(state.current.mouse);

            renderer.render(scene, camera);
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('resize', handleResize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 9999,
                mixBlendMode: 'overlay',
                display: 'var(--display-shader, block)'
            }}
        />
    );
};

export default ScrollShaderOverlay;