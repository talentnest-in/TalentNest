import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import type { Quiz, QuizAttempt } from '@/services/academy.service';

interface QuizCardProps {
  quiz: Quiz;
  attempts: QuizAttempt[];
  onStartQuiz: () => void;
  onRetryQuiz: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  attempts,
  onStartQuiz,
  onRetryQuiz,
}) => {
  const latestAttempt = attempts[0];
  const hasPassed = latestAttempt?.passed;
  const canRetry = attempts.length < quiz.maxAttempts;
  const remainingAttempts = quiz.maxAttempts - attempts.length;

  if (latestAttempt) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {quiz.title}
            </h3>
            {quiz.description && (
              <p className="text-sm text-gray-600">{quiz.description}</p>
            )}
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              hasPassed
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {hasPassed ? 'Passed' : 'Failed'}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {(latestAttempt?.score || 0).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Attempt</p>
              <p className="text-2xl font-bold text-gray-900">
                {latestAttempt.attemptNumber}/{quiz.maxAttempts}
              </p>
            </div>
          </div>
        </div>

        {canRetry && !hasPassed && (
          <button
            onClick={onRetryQuiz}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Quiz ({remainingAttempts} attempts left)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{quiz.title}</h3>
      {quiz.description && (
        <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        {quiz.timeLimit && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{quiz.timeLimit} minutes</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>{quiz.questions?.length || 0} questions</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Pass: {quiz.passPercentage}%</span>
        </div>
      </div>

      <button
        onClick={onStartQuiz}
        className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Start Quiz
      </button>
    </div>
  );
};
