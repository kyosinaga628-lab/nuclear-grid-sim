import React from 'react';
import './Tutorial.css';

interface TutorialGuideProps {
    step: number;
    totalSteps: number;
    title: string;
    description: React.ReactNode;
    onNext?: () => void;
    onSkip: () => void;
    nextLabel?: string;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({
    step, totalSteps, title, description, onNext, onSkip, nextLabel = "次へ"
}) => {
    return (
        <div className="tutorial-overlay">
            <div className="tutorial-progress">
                STEP {step + 1} / {totalSteps}
            </div>
            <h3 style={{ margin: '8px 0', color: '#60a5fa' }}>{title}</h3>
            <div style={{ fontSize: '1rem', lineHeight: '1.5', marginBottom: '10px' }}>
                {description}
            </div>

            <div className="tutorial-actions">
                <button className="tutorial-btn secondary" onClick={onSkip}>
                    終了
                </button>
                {onNext && (
                    <button className="tutorial-btn" onClick={onNext}>
                        {nextLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TutorialGuide;
