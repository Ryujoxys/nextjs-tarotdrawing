'use client'
import React, { useState, useEffect } from 'react'
import '../globals.css'
import { tarotImageUrls } from '../tarot-images'

// 定义卡牌类型接口
interface Card {
  id: number;      // 卡牌唯一标识
  name: string;    // 卡牌名称
  imageUrl: string; // 卡牌图片URL
  isReversed?: boolean; // 是否逆位
}

// 移动端塔罗牌组件
export default function MobileTarot() {
  // 状态管理
  const [cards, setCards] = useState<Card[]>([]); // 所有卡牌的状态
  const [selectedCards, setSelectedCards] = useState<Card[]>([]); // 已选择的卡牌
  const [isRandomDrawing, setIsRandomDrawing] = useState(false); // 是否正在随机抽牌

  // 组件加载时生成所有卡牌
  useEffect(() => {
    const allCards: Card[] = []; // 创建空数组存储所有卡牌
    // 遍历tarotImageUrls对象,生成卡牌数据
    Object.entries(tarotImageUrls).forEach(([name, imageUrl], index) => {
      // 排除牌背图片
      if (name !== 'cardBack') {
        // 添加新卡牌到数组,初始不设置正逆位
        allCards.push({
          id: index,
          name,
          imageUrl
        });
      }
    });
    // 随机打乱卡牌顺序并更新状态
    const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
  }, []);

  // 随机抽牌函数
  const startRandomDraw = () => {
    if (isRandomDrawing) return; // 如果正在抽牌中,则不执行
    setIsRandomDrawing(true); // 设置抽牌状态为true
    setSelectedCards([]); // 清空已选卡牌

    const availableCards = [...cards]; // 复制一份可用卡牌数组
    // 递归函数,处理抽牌动画
    const drawNextCard = (drawnCards: Card[]) => {
      // 如果已抽取3张牌,结束抽牌
      if (drawnCards.length === 3) {
        setSelectedCards(drawnCards);
        setIsRandomDrawing(false);
        return;
      }

      // 随机选择一张牌并计算正逆位
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const selectedCard = availableCards.splice(randomIndex, 1)[0];
      const cardWithReversed = {
        ...selectedCard,
        isReversed: Math.random() > 0.5 // 选择时计算正逆位
      };
      const newDrawnCards = [...drawnCards, cardWithReversed];
      setSelectedCards(newDrawnCards);

      // 延迟1秒后抽下一张牌
      setTimeout(() => drawNextCard(newDrawnCards), 1000);
    };

    // 开始抽牌
    drawNextCard([]);
  };

  // 手动选牌函数
  const selectCard = (card: Card) => {
    if (isRandomDrawing) return; // 随机抽牌过程中禁止手动选择
    if (selectedCards.length >= 3) return; // 最多只能选择3张牌
    if (selectedCards.find(c => c.id === card.id)) return; // 同一张牌不能重复选择

    // 选择卡牌时计算正逆位
    const selectedCardWithReversed = {
      ...card,
      isReversed: Math.random() > 0.5 // 选择时计算正逆位
    };

    // 添加选中的牌到已选数组
    setSelectedCards([...selectedCards, selectedCardWithReversed]);
  };

  // 生成扇形布局函数
  const generateFanLayout = (index: number, totalCards: number) => {
    const radius = 170
; // 增大扇形半径
    const spreadAngle = 60; // 增大扇形展开角度
    const startAngle = -spreadAngle / 2; // 起始角度
    const angleStep = spreadAngle / (totalCards - 1); // 每张牌之间的角度
    const currentAngle = startAngle + angleStep * index; // 当前牌的角度
    const scale = 1; // 缩小卡牌尺寸以适应更密集的布局

    // 计算卡牌在圆弧上的位置
    const radians = (currentAngle * Math.PI) / 180;
    const x = Math.sin(radians) * radius;
    const y = -Math.cos(radians) * radius;

    // 返回计算后的变换样式
    return {
      transform: `translate(${x}px, ${y}px) rotate(${currentAngle}deg) scale(${scale})`,
      transformOrigin: 'center center',
    };
  };

  // 渲染组件
  return (
    <div className="mobile-tarot-container">
      {/* 标题区域 */}
      <h1 className="drawing-title">塔罗牌抽取</h1>
      <h2 className="drawing-subtitle">选择三张牌以获得指引</h2>
      
      {/* 随机抽牌按钮 */}
      <button 
        className="random-draw-button"
        onClick={startRandomDraw}
        disabled={isRandomDrawing}
      >
        {selectedCards.length > 0 ? '重新抽牌' : '随机抽牌'}
      </button>

      {/* 扇形展示区域 */}
      <div className="mobile-tarot-fan" style={{
        position: 'relative',
        width: '100%',
        height: '50vh',
        margin: '10px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {cards.map((card, index) => {
            // 如果卡牌已被选中，返回null而不是空的div
            if (selectedCards.find(c => c.id === card.id)) {
              return null;
            }

            const layoutStyle = generateFanLayout(index, cards.length);
            
            return (
              <div
                key={card.id}
                className="tarot-card-mobile"
                style={{
                  position: 'absolute',
                  width: '75px',
                  height: '131.25px',
                  transition: 'all 0.3s ease',
                  ...layoutStyle
                }}
                onClick={() => selectCard(card)}
              >
                <img 
                  src={tarotImageUrls.cardBack}
                  alt={card.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 已选卡牌展示区域 */}
      <div className="mobile-card-positions">
        {['过去', '现在', '未来'].map((position, index) => (
          <div key={position} className="card-position">
            {selectedCards[index] ? (
              <img
                src={selectedCards[index].imageUrl}
                alt={selectedCards[index].name}
                className="selected-card-image"
                style={{
                  transform: selectedCards[index].isReversed ? 'rotate(180deg)' : 'none'
                }}
              />
            ) : (
              <div className="position-placeholder">
                <span className="position-label">{position}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 