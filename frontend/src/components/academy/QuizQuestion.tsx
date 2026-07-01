import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { QuizQuestion as QuizQuestionType } from '@/services/academy.service';

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedAnswer: string | null;
  onAnswerSelect: (answerId: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  showResult = false,
  isCorrect,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-orange-700">
            {question.order + 1}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
          {question.explanation && (
            <p className="text-sm text-gray-600">{question.explanation}</p>
          )}
        </div>
        {showResult && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 ml-12">
        {question.answers?.map((answer) => (
          <button
            key={answer.id}
            onClick={() => !showResult && onAnswerSelect(answer.id)}
            disabled={showResult}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
              selectedAnswer === answer.id
                ? showResult
                  ? answer.isCorrect
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-orange-50 border-orange-200 text-orange-700'
                : showResult && answer.isCorrect
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedAnswer === answer.id
                    ? showResult
                      ? answer.isCorrect
                        ? 'border-green-500 bg-green-500'
                        : 'border-red-500 bg-red-500'
                      : 'border-orange-500 bg-orange-500'
                    : showResult && answer.isCorrect
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedAnswer === answer.id || (showResult && answer.isCorrect) && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="flex-1">{answer.answer}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
