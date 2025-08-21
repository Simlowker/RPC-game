// src/games/RPS/components/CreateMatchModal.tsx - Create Match Modal Component
import React from 'react';
import styled from 'styled-components';
import { SolDuelUi } from '../../../components/UI';
import { Modal } from '../../../components/Modal';
import { CreateMatchForm, GameConfig } from '../types';
import { validateBetAmount, solToLamports, calculatePayout } from '../../../rps-client';

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 400px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: white;
`;

const Input = styled.input`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
  }

  option {
    background: #1f2937;
    color: white;
  }
`;

const ErrorText = styled.span`
  color: #f87171;
  font-size: 12px;
`;

const InfoBox = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #93c5fd;
`;

const PayoutInfo = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #6ee7b7;
  text-align: center;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CreateMatchForm;
  onChange: (form: CreateMatchForm) => void;
  onSubmit: () => void;
  config: GameConfig;
  isCreating: boolean;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  config,
  isCreating,
}) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Validate form
  React.useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validate bet amount
    const betAmount = parseFloat(form.betAmount);
    if (isNaN(betAmount)) {
      newErrors.betAmount = 'Please enter a valid number';
    } else {
      const betError = validateBetAmount(betAmount, config.minBet, config.maxBet);
      if (betError) {
        newErrors.betAmount = betError;
      }
    }

    // Validate deadlines
    if (form.joinDeadlineMinutes < 5) {
      newErrors.joinDeadline = 'Join deadline must be at least 5 minutes';
    }
    if (form.revealDeadlineMinutes < 5) {
      newErrors.revealDeadline = 'Reveal deadline must be at least 5 minutes';
    }
    if (form.revealDeadlineMinutes > form.joinDeadlineMinutes) {
      newErrors.revealDeadline = 'Reveal deadline must be less than join deadline';
    }

    setErrors(newErrors);
  }, [form, config]);

  const isValid = Object.keys(errors).length === 0;
  const betAmount = parseFloat(form.betAmount) || 0;
  const potentialPayout = calculatePayout(betAmount, config.feeBps);

  const handleSubmit = () => {
    if (isValid && !isCreating) {
      onSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
        🎮 Create New RPS Match
      </h2>

      <Form>
        <InputGroup>
          <Label>Bet Amount (SOL)</Label>
          <Input
            type="number"
            min={config.minBet}
            max={config.maxBet}
            step="0.001"
            value={form.betAmount}
            onChange={(e) => onChange({ ...form, betAmount: e.target.value })}
            placeholder={`${config.minBet} - ${config.maxBet} SOL`}
          />
          {errors.betAmount && <ErrorText>{errors.betAmount}</ErrorText>}
        </InputGroup>

        <InputGroup>
          <Label>Join Deadline (Minutes)</Label>
          <Select
            value={form.joinDeadlineMinutes}
            onChange={(e) => onChange({ ...form, joinDeadlineMinutes: parseInt(e.target.value) })}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={360}>6 hours</option>
            <option value={720}>12 hours</option>
            <option value={1440}>24 hours</option>
          </Select>
          {errors.joinDeadline && <ErrorText>{errors.joinDeadline}</ErrorText>}
        </InputGroup>

        <InputGroup>
          <Label>Reveal Deadline (Minutes after join)</Label>
          <Select
            value={form.revealDeadlineMinutes}
            onChange={(e) => onChange({ ...form, revealDeadlineMinutes: parseInt(e.target.value) })}
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </Select>
          {errors.revealDeadline && <ErrorText>{errors.revealDeadline}</ErrorText>}
        </InputGroup>

        {betAmount > 0 && (
          <PayoutInfo>
            💰 Winner takes: {potentialPayout.toFixed(4)} SOL
            <br />
            <small>Platform fee: {config.feeBps / 100}%</small>
          </PayoutInfo>
        )}

        <InfoBox>
          ⚡ Your match will be visible to all players. Once someone joins, 
          you'll both need to make your choices and reveal them within the time limits.
        </InfoBox>

        <ButtonRow>
          <SolDuelUi.Button 
            onClick={onClose}
            style={{ flex: 1, background: '#6b7280' }}
          >
            Cancel
          </SolDuelUi.Button>
          <SolDuelUi.Button
            main
            onClick={handleSubmit}
            disabled={!isValid || isCreating}
            style={{ flex: 1 }}
          >
            {isCreating ? 'Creating...' : `Create Match (${form.betAmount} SOL)`}
          </SolDuelUi.Button>
        </ButtonRow>
      </Form>
    </Modal>
  );
};