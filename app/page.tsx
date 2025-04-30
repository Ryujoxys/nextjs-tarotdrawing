'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import './globals.css'
import { tarotImageUrls } from './tarot-images'

// API设置类型
interface ApiSettings {
  apiKey: string;
  apiUrl: string;
  model: string;
  customModel: string;
  temperature: number;
}

// 卡牌类型
interface Card {
  index: number;
  name: string;
  displayName: string;
  isReversed: boolean;
  imageUrl: string;
}

// 牌阵配置类型
interface SpreadConfig {
  title: string;
  labels: string[];
  maxCards: number;
}

// 定义塔罗牌数据结构
const tarotData = {
  // 大阿卡纳牌（22张主牌）
  majorArcana: [
    "愚人", "魔法师", "女祭司", "皇后", "皇帝", "教皇", "恋人", "战车", 
    "力量", "隐士", "命运之轮", "正义", "倒吊人", "死神", "节制", "恶魔", 
    "高塔", "星星", "月亮", "太阳", "审判", "世界"
  ],
  // 小阿卡纳牌（56张副牌）
  minorArcana: {
    // 四种花色：权杖、圣杯、宝剑、星币
    suits: ["权杖", "圣杯", "宝剑", "星币"],
    // 每种花色14张牌：Ace到10，以及侍卫、骑士、王后、国王
    values: ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "侍卫", "骑士", "王后", "国王"]
  }
}

// 牌阵配置
const spreadConfigs: Record<string, SpreadConfig> = {
  'three-card': {
    title: '三张牌阵',
    labels: ['过去', '现在', '未来'],
    maxCards: 3
  },
  'cross': {
    title: '十字牌阵',
    labels: ['核心问题', '挑战', '当前状态', '影响', '结果'],
    maxCards: 5
  },
  'five-card': {
    title: '发展牌阵',
    labels: ['当前状态', '未来发展', '障碍', '最终结果', '建议'],
    maxCards: 5
  },
  'single-card': {
    title: '单张牌阵',
    labels: ['指引'],
    maxCards: 1
  }
}

// 生成完整的塔罗牌组
const generateAllCards = () => {
  const allCards = [];
  // 添加大阿卡纳牌
  tarotData.majorArcana.forEach(card => {
    allCards.push({
      name: card,
      displayName: card,
      isReversed: false,
      imageUrl: tarotImageUrls[card]  // 添加图片URL
    });
  });
  // 添加小阿卡纳牌
  tarotData.minorArcana.suits.forEach(suit => {
    tarotData.minorArcana.values.forEach(value => {
      const cardName = `${suit}${value}`;
      allCards.push({
        name: cardName,
        displayName: cardName,
        isReversed: false,
        imageUrl: tarotImageUrls[cardName]  // 添加图片URL
      });
    });
  });
  return allCards;
};

export default function Home() {
  const router = useRouter();

  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      // 检查是否是移动设备
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      // 检查屏幕宽高比是否小于1(竖屏)
      const isNarrowScreen = window.innerWidth / window.innerHeight < 1;
      
      // 只有同时满足移动设备和竖屏条件才跳转到移动端页面
      if (isMobileDevice && isNarrowScreen) {
        router.push('/mobile');
      }
    };

    // 初始检查
    checkDevice();
    // 监听窗口大小变化
    window.addEventListener('resize', checkDevice);
    // 清理监听器
    return () => window.removeEventListener('resize', checkDevice);
  }, [router]);

  // 状态管理
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiKey: '',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    customModel: '',
    temperature: 0.7
  })
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [showReadingModal, setShowReadingModal] = useState(false)
  const [readingData, setReadingData] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isRandomDrawing, setIsRandomDrawing] = useState(false)
  const [isShuffling, setIsShuffling] = useState(true); // 初始加载时开始洗牌
  const [shufflePhase, setShufflePhase] = useState<'initial' | 'scatter' | 'merge' | 'fan' | 'complete'>('initial');

  const fanContainerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // 扇形布局参数
  const numCards = 78;  // 显示所有78张牌
  const isWideAspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight >= 1 : true;
  const fanRadius = isWideAspect ? 400 : 250;  // 扇形半径
  const vertOffset = isWideAspect ? -250 : -70;  // 垂直偏移量
  const totalAngle = 60;  // 扇形总角度
  const startAngle = -totalAngle / 2;  // 起始角度（从中心向左）
  const angleStep = totalAngle / (numCards - 1);  // 每张牌的角度间隔

  // 修改扇形中心点位置到左侧
  const centerAngle = -30; // 扇形-30度位置（左侧）
  const centerAngleRad = (centerAngle * Math.PI) / 180;
  const centerX = fanRadius * Math.sin(centerAngleRad);
  const centerY = -fanRadius * Math.cos(centerAngleRad) - vertOffset;

  // 初始化和洗牌动画
  useEffect(() => {
    const allCards = generateAllCards();
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);

    // 开始洗牌动画序列
    const startShuffleAnimation = () => {
      // 第一阶段：牌堆分散（2.5秒）
      setShufflePhase('scatter');
      
      setTimeout(() => {
        // 第二阶段：合并为牌堆（2秒）
        setShufflePhase('merge');
        
        setTimeout(() => {
          // 第三阶段：展开成扇形（2.5秒）
          setShufflePhase('fan');
          
          setTimeout(() => {
            // 完成洗牌
            setShufflePhase('complete');
            setIsShuffling(false);
          }, 2500);
        }, 2000);
      }, 2500);
    };

    // 启动洗牌动画
    startShuffleAnimation();
  }, []);

  // 选择卡牌
  const selectCard = (index: number) => {
    if (isRandomDrawing) return; // 随机抽牌过程中禁止手动选择
    if (selectedCards.length >= 3) return
    if (selectedCards.some(card => card.index === index)) return
    
    const isReversed = Math.random() < 0.5
    const card = cards[index]
    setSelectedCards([...selectedCards, {
      ...card,
      index,
      isReversed,
      displayName: isReversed ? `${card.name} - 逆位` : card.name
    }])
    
    // 如果选满3张牌，显示解读界面
    if (selectedCards.length === 2) {
      showReadingInterface()
    }
  }

  // 随机抽牌
  const startRandomDraw = () => {
    if (selectedCards.length > 0) {
      // 如果已经有选择的卡牌，先重置
      setSelectedCards([]);
      return;
    }

    setIsRandomDrawing(true);
    const availableIndices = Array.from({ length: cards.length }, (_, i) => i);
    
    // 随机选择三张不重复的卡牌
    const drawNextCard = (currentIndex) => {
      if (currentIndex >= 3) {
        setIsRandomDrawing(false);
        return;
      }

      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const cardIndex = availableIndices[randomIndex];
      availableIndices.splice(randomIndex, 1);

      const isReversed = Math.random() < 0.5;
      const card = cards[cardIndex];
      
      setTimeout(() => {
        setSelectedCards(prev => [...prev, {
          ...card,
          index: cardIndex,
          isReversed,
          displayName: isReversed ? `${card.name} - 逆位` : card.name
        }]);
        drawNextCard(currentIndex + 1);
      }, 1000); // 每张牌之间间隔1秒
    };

    drawNextCard(0);
  };

  // 显示解读界面
  const showReadingInterface = () => {
    const now = new Date()
    const dateOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }
    
    const readingData = {
      question: "塔罗指引",
      spreadType: 'three-card',
      spreadName: '三张牌阵',
      cards: selectedCards.map((card, index) => ({
        name: card.displayName,
        position: ['过去', '现在', '未来'][index],
        index
      })),
      date: now.toLocaleDateString('zh-CN', dateOptions)
    }
    
  }

  // 生成扇形卡牌布局
  const generateFanLayout = (index: number, totalCards: number) => {
    const angle = startAngle + index * angleStep;
    const angleRad = (angle * Math.PI) / 180;
    const x = fanRadius * Math.sin(angleRad);
    const y = -fanRadius * Math.cos(angleRad) - vertOffset;
    
    // 根据洗牌阶段计算卡牌位置
    let cardStyle: React.CSSProperties = {
      transform: `translate(-50%, 0) translate(${x}px, ${y}px) rotate(${angle}deg)`,
      opacity: selectedCards.some(c => c.index === index) ? 0 : 1,
      zIndex: index + 10,
      transition: 'all 0.5s ease'
    };

    // 不同阶段的位置计算
    if (shufflePhase === 'initial') {
      // 初始状态：所有牌叠在左侧
      cardStyle.transform = `translate(-50%, 0) translate(${centerX}px, ${centerY}px) rotate(${-30}deg)`;
      cardStyle.opacity = 1;
    } else if (shufflePhase === 'scatter') {
      // 分散状态：随机分布在左侧区域，并添加随机旋转
      const randomAngle = Math.random() * 720 - 360; // -360到360度的随机旋转
      const randomRadius = Math.random() * (fanRadius * 0.8); // 更大的散布范围
      const randomX = centerX + (Math.random() - 0.5) * fanRadius * 1.2; // 在中心点周围水平散布
      const randomY = centerY + (Math.random() - 0.5) * fanRadius * 1.2; // 在中心点周围垂直散布
      cardStyle.transform = `translate(-50%, 0) translate(${randomX}px, ${randomY}px) rotate(${randomAngle}deg)`;
      cardStyle.transition = 'transform 2.5s cubic-bezier(0.4, 0, 0.2, 1)';
      cardStyle.zIndex = Math.floor(Math.random() * 78); // 随机层级
    } else if (shufflePhase === 'merge') {
      // 合并状态：回到左侧牌堆
      cardStyle.transform = `translate(-50%, 0) translate(${centerX}px, ${centerY}px) rotate(${-30}deg)`;
      cardStyle.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)';
      cardStyle.zIndex = index; // 恢复原始层级
    } else if (shufflePhase === 'fan') {
      // 展开状态：从左向右展开成扇形
      cardStyle.transform = `translate(-50%, 0) translate(${x}px, ${y}px) rotate(${angle}deg)`;
      cardStyle.transition = 'transform 2.5s cubic-bezier(0.4, 0, 0.2, 1)';
      cardStyle.zIndex = index; // 保持扇形层级
    }

    return cardStyle;
  };

  return (
    <main className="tarot-container">
      <h1 className="drawing-title">抽取您的塔罗牌</h1>
      <p className="drawing-subtitle">点击卡牌，获取塔罗能量指引</p>
      
      <button 
        className="random-draw-button"
        onClick={startRandomDraw}
        disabled={isRandomDrawing || isShuffling}
      >
        {selectedCards.length > 0 ? '重新抽牌' : '随机抽牌'}
      </button>

      <div className="tarot-fan" ref={fanContainerRef}>
        {/* 渲染所有牌的位置,选中的牌设置透明度为0 */}
        {cards.map((card, index) => (
          <div
            key={card.index}
            className="tarot-card"
            style={{
              ...generateFanLayout(index, cards.length),
              transform: `${generateFanLayout(index, cards.length).transform}`,
              opacity: selectedCards.some(selected => selected.index === card.index) ? 0 : (isShuffling ? 0 : 1),
              transition: 'opacity 0.3s ease',
              pointerEvents: selectedCards.some(selected => selected.index === card.index) ? 'none' : 'auto'
            }}
            onClick={() => !isShuffling && selectCard(card.index)}
          >
            <div 
              className="card-back" 
              style={{ 
                backgroundImage: `url('${tarotImageUrls.cardBack}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: '100%',
                height: '100%',
                position: 'absolute',
                borderRadius: '8px'
              }} 
            />
          </div>
        ))}
      </div>

      <div className="card-positions">
        {[1, 2, 3].map((position) => (
          <div key={position} className="card-position">
            <div 
              className="position-placeholder"
              style={{
                width: '120px',
                height: '200px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#FFD700',
                fontSize: '24px',
                background: 'rgba(0, 0, 0, 0.3)'
              }}
            >
              {selectedCards[position - 1] ? (
                <img 
                  src={selectedCards[position - 1].imageUrl} 
                  alt={selectedCards[position - 1].displayName}
                  className="selected-card-image"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    transform: selectedCards[position - 1].isReversed ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.5s ease'
                  }}
                />
              ) : (
                <span>{position}</span>
              )}
            </div>
            <div 
              className="position-label"
              style={{
                marginTop: '10px',
                color: '#FFD700',
                fontSize: '16px',
                textAlign: 'center'
              }}
            >
              {position === 1 ? '过去' : position === 2 ? '现在' : '未来'}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .tarot-container {
          padding: 20px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #1a1a2e;
        }

        .drawing-title {
          color: #FFD700;
          font-size: 32px;
          margin-bottom: 10px;
        }

        .drawing-subtitle {
          color: #FFD700;
          font-size: 18px;
          margin-bottom: 40px;
        }

        .tarot-fan {
          position: relative;
          width: 100%;
          height: 400px;
          margin-bottom: 40px;
        }

        .tarot-card {
          position: absolute;
          width: 150px;
          height: 260px;
          cursor: pointer;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .card-positions {
          display: flex;
          gap: 40px;
          margin-top: 20px;
        }

        .card-position {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
    </main>
  )
} 