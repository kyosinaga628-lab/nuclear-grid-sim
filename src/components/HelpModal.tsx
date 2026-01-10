import React from 'react';
import './HelpModal.css';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <h2>Grid Simulator ガイド</h2>

                <div className="modal-section">
                    <h3>⚡️ 操作方法</h3>
                    <ul>
                        <li><strong>原発アイコン:</strong> クリックして詳細表示 & START/STOP 切り替え</li>
                        <li><strong>Grid Load:</strong> 全国の電力需要を調整（右で増加、左で減少）</li>
                    </ul>
                </div>

                <div className="modal-section">
                    <h3>🗺 凡例（色の意味）</h3>
                    <div className="legend-row">
                        <span className="dot green">●</span> <strong>緑 (≥30%)</strong>: 原子力供給が潤沢
                    </div>
                    <div className="legend-row">
                        <span className="dot yellow">●</span> <strong>黄 (10-30%)</strong>: 中程度の依存度
                    </div>
                    <div className="legend-row">
                        <span className="dot red">●</span> <strong>赤 (&lt;10%)</strong>: 原子力供給不足
                    </div>
                </div>

                <div className="modal-section">
                    <h3>👀 見どころ</h3>
                    <p>
                        <strong>地域間融通:</strong> 電力が余っている地域から、足りない地域へ
                        <span style={{ color: '#e879f9', fontWeight: 'bold' }}> 紫色の線 </span>
                        で電力が送られます。
                        東京・中部間などで双方向の電力融通が観察できます。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
