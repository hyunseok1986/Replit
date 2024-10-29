import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Sun, Droplets, Thermometer, Cloud, CloudRain } from 'lucide-react';

const PlantSimulator = () => {
  const [temperature, setTemperature] = useState(25);
  const [humidity, setHumidity] = useState(50);
  const [light, setLight] = useState(50);
  const [waterMolecules, setWaterMolecules] = useState([]);
  const animationFrameRef = useRef();
  const lastUpdateRef = useRef(0);

  // 증산작용 공식
  const calculateTranspirationRate = () => {
    const transpirationRate = (light * 0.4) + (temperature * 0.3) + ((100 - humidity) * 0.3);
    return Math.max(0, Math.min(100, transpirationRate));
  };

  // 물 분자 생성 간격 계산 (ms) - 더 빠른 생성을 위해 수정
  const calculateGenerationInterval = (rate) => {
    // 증산량에 따라 20ms(매우 빠름)에서 800ms(매우 느림) 사이의 값을 반환
    return 800 - ((rate / 100) * 780);
  };

  // 물 분자 최대 개수 계산 - 더 많은 물 분자 생성을 위해 수정
  const calculateMaxMolecules = (rate) => {
    // 증산량에 따라 5개(최소)에서 150개(최대) 사이의 값을 반환
    return Math.floor(5 + ((rate / 100) * 145));
  };

  // 물 분자 속도 계산 - 속도 범위 확대
  const calculateMoleculeSpeed = (rate) => {
    // 증산량에 따라 0.1(매우 느림)에서 3.0(매우 빠름) 사이의 값을 반환
    return 0.1 + ((rate / 100) * 2.9);
  };

  const createNewMolecule = () => {
    const stomataPositions = [
      { x: 85, y: 150 },
      { x: 75, y: 130 },
      { x: 90, y: 120 },
      { x: 80, y: 110 },
      { x: 215, y: 150 },
      { x: 225, y: 130 },
      { x: 210, y: 120 },
      { x: 220, y: 110 },
    ];

    const startPos = stomataPositions[Math.floor(Math.random() * stomataPositions.length)];
    const isLeftSide = startPos.x < 150;
    const transpirationRate = calculateTranspirationRate();
    const moleculeSpeed = calculateMoleculeSpeed(transpirationRate);

    // 물 분자의 크기와 투명도 범위를 더 극적으로 조정
    const size = 1.5 + (transpirationRate / 100) * 3.5;
    const opacity = 0.5 + (transpirationRate / 100) * 0.5;

    return {
      id: Math.random(),
      startX: startPos.x,
      startY: startPos.y,
      offsetX: isLeftSide ? (-20 - Math.random() * 30) : (20 + Math.random() * 30),
      offsetY: -60 - Math.random() * 40,
      speed: moleculeSpeed,
      amplitude: 3 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
      currentX: startPos.x,
      currentY: startPos.y,
      size: size,
      opacity: opacity
    };
  };

  const updateMolecules = (timestamp) => {
    if (!lastUpdateRef.current) {
      lastUpdateRef.current = timestamp;
    }

    const deltaTime = timestamp - lastUpdateRef.current;
    lastUpdateRef.current = timestamp;
    const transpirationRate = calculateTranspirationRate();
    const baseSpeed = calculateMoleculeSpeed(transpirationRate);

    setWaterMolecules(prevMolecules => 
      prevMolecules.map(molecule => {
        if (molecule.currentY < -50) {
          return null;
        }

        const progress = deltaTime * 0.03 * baseSpeed;

        return {
          ...molecule,
          currentX: molecule.currentX + 
            (Math.sin(timestamp * 0.001 * molecule.speed + molecule.phase) * molecule.amplitude * 0.1) + 
            (molecule.offsetX * progress * 0.05),
          currentY: molecule.currentY + (molecule.offsetY * progress * 0.05)
        };
      }).filter(Boolean)
    );

    animationFrameRef.current = requestAnimationFrame(updateMolecules);
  };

  useEffect(() => {
    const transpirationRate = calculateTranspirationRate();
    const generationInterval = calculateGenerationInterval(transpirationRate);
    const maxMolecules = calculateMaxMolecules(transpirationRate);

    const interval = setInterval(() => {
      if (waterMolecules.length < maxMolecules) {
        // 증산량이 높을 때 한 번에 더 많은 물 분자 생성
        const batchSize = Math.ceil((transpirationRate / 100) * 3);
        const newMolecules = Array(batchSize).fill(null).map(() => createNewMolecule());
        setWaterMolecules(prev => [...prev, ...newMolecules]);
      }
    }, generationInterval);

    animationFrameRef.current = requestAnimationFrame(updateMolecules);

    return () => {
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [temperature, humidity, light]);

  const getTranspirationStatus = () => {
    const rate = calculateTranspirationRate();
    if (rate >= 80) return "💨 증산작용이 매우 활발하게 일어나고 있어요!";
    if (rate >= 60) return "💨 증산작용이 활발하게 일어나고 있어요.";
    if (rate >= 40) return "💨 증산작용이 적당히 일어나고 있어요.";
    if (rate >= 20) return "💨 증산작용이 천천히 일어나고 있어요.";
    return "💨 증산작용이 매우 천천히 일어나고 있어요.";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6">🌱 식물 증산작용 시뮬레이터 🌱</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6 p-4 bg-gray-50 rounded-lg shadow-inner">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
              <Thermometer className="text-red-500 h-8 w-8" />
              <span className="font-semibold text-lg">온도: {temperature}°C</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              min={15}
              max={35}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
              <Droplets className="text-blue-500 h-8 w-8" />
              <span className="font-semibold text-lg">습도: {humidity}%</span>
            </div>
            <Slider
              value={[humidity]}
              onValueChange={([value]) => setHumidity(value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
              <Sun className="text-yellow-500 h-8 w-8" />
              <span className="font-semibold text-lg">빛의 강도: {light}%</span>
            </div>
            <Slider
              value={[light]}
              onValueChange={([value]) => setLight(value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <div className="relative h-[500px] bg-gradient-to-b from-sky-100 to-sky-50 rounded-lg overflow-hidden shadow-lg">
          <div 
            className="absolute top-4 right-4 transition-all duration-500"
            style={{
              transform: `scale(${0.5 + (light/100) * 0.5})`,
              opacity: light/100,
            }}
          >
            <div className="relative">
              <Sun 
                size={80} 
                className="text-yellow-500 animate-pulse" 
                style={{
                  filter: `blur(${(100-light)/10}px)`
                }}
              />
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(252, 211, 77, 0.4) 0%, rgba(252, 211, 77, 0) 70%)`,
                  transform: `scale(${1 + (light/100)})`,
                  opacity: light/100,
                }}
              />
            </div>
          </div>

          {humidity > 60 && (
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`cloud-${i}`}
                  className="absolute transition-all duration-500"
                  style={{
                    top: `${i * 15}%`,
                    left: `${i * 20}%`,
                    opacity: (humidity - 60) / 40,
                  }}
                >
                  {humidity > 70 ? (
                    <CloudRain size={60} className="text-gray-600" />
                  ) : (
                    <Cloud size={60} className="text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="absolute left-4 top-4 bg-white rounded-xl p-3 shadow-lg">
            <div className="relative w-8 h-24 bg-white border-2 border-gray-300 rounded-full overflow-hidden">
              <div 
                className="absolute bottom-0 w-full transition-all duration-500 rounded-full"
                style={{
                  height: `${((temperature - 15) / 20) * 100}%`,
                  backgroundColor: temperature > 25 ? '#ef4444' : '#3b82f6',
                }}
              />
            </div>
            <div className="text-center mt-1 font-bold">
              {temperature}°C
            </div>
          </div>

          <svg
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
            width="300"
            height="400"
            viewBox="0 0 300 400"
          >
            <defs>
              <filter id="water-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
              </filter>
            </defs>

            <path
              d="M150 380 C150 380 150 250 150 200"
              stroke="#2d8a3e"
              strokeWidth="20"
              fill="none"
            />

            <g className="leaves">
              <path
                d="M150 250 C70 220 30 160 60 100 C90 40 150 200 150 200"
                fill="#4ade80"
              />
              <ellipse cx="85" cy="150" rx="4" ry="2" fill="#1f2937" opacity="0.3" />
              <ellipse cx="75" cy="130" rx="4" ry="2" fill="#1f2937" opacity="0.3" />
              <ellipse cx="90" cy="120" rx="4" ry="2" fill="#1f2937" opacity="0.3" />
              <ellipse cx="80" cy="110" rx="4" ry="2" fill="#1f2937" opacity="0.3" />

              <path
                d="M150 250 C230 220 270 160 240 100 C210 40 150 200 150 200"
                fill="#4ade80"
              />
              <ellipse cx="215" cy="150" rx="4" ry="2" fill="#1f2937" opacity="0.3" />
              <ellipse cx="225" cy="130" rx="4" ry="2" fill="#1f2937" opacity="0.3" />
              <ellipse cx="210" cy="120" rx="4" ry="2" fill="#1f2937" opacity="0.3" />
              <ellipse cx="220" cy="110" rx="4" ry="2" fill="#1f2937" opacity="0.3" />

              <path
                d="M150 200 C120 150 150 100 150 100 C150 100 180 150 150 200"
                fill="#4ade80"
              />
            </g>

            {waterMolecules.map(molecule => (
              <g key={molecule.id}>
                <circle 
                  cx={molecule.currentX}
                  cy={molecule.currentY}
                  r={molecule.size}
                  fill="#60a5fa"
                  fillOpacity={molecule.opacity}
                  filter="url(#water-blur)"
                />
                <circle 
                  cx={molecule.currentX}
                  cy={molecule.currentY}
                  r={molecule.size * 0.6}
                  fill="#93c5fd"
                  fillOpacity={molecule.opacity * 0.8}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-inner">
        <h2 className="text-lg font-bold mb-2 text-green-800">현재 증산작용 상태:</h2>
        <div className="space-y-2">
                    <p className="text-gray-700">
                      {getTranspirationStatus()}
                    </p>
                    <p className="text-gray-700">
                     
                    </p>
                    <p className="text-gray-700">
                      {temperature > 30 ? "🌡️ 높은 온도로 인해 증산작용이 촉진되고 있어요!" : 
                       temperature < 20 ? "🌡️ 낮은 온도로 인해 증산작용이 억제되고 있어요." :
                       "🌡️ 적절한 온도에서 증산작용이 일어나고 있어요."}
                    </p>
                    <p className="text-gray-700">
                      {humidity > 70 ? "💧 높은 습도로 인해 증산작용이 크게 억제되고 있어요." :
                       humidity < 30 ? "💧 낮은 습도로 인해 증산작용이 매우 활발해요!" :
                       "💧 적당한 습도에서 증산작용이 일어나고 있어요."}
                    </p>
                    <p className="text-gray-700">
                      {light > 70 ? "☀️ 강한 빛으로 인해 기공이 활짝 열려 증산작용이 촉진되고 있어요!" :
                       light < 30 ? "☀️ 약한 빛으로 인해 기공이 조금만 열려 증산작용이 억제되고 있어요." :
                       "☀️ 적당한 빛으로 인해 기공이 열려 증산작용이 일어나고 있어요."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">💡 시뮬레이터 사용 시 유의사항</h3>
                  <p className="text-sm text-amber-700">
                    • 이 시뮬레이터는 교육 목적으로 제작된 가상의 모델이며, 실제 증산작용의 정확한 수치를 반영하지 않습니다.
                    <br />
                    • 온도, 습도, 빛의 영향을 직관적으로 이해하기 위한 것으로, 실제 증산작용은 더 복잡한 요인들의 상호작용으로 일어납니다.
                  </p>
                </div>
                <div className="mt-4 text-center font-semibold text-black">
                  제작: 교사 허성철
                </div>
              </div>
            );
          };

          export default PlantSimulator;