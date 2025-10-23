import React from 'react';
import WordSearchApp from '../wordsearch/WordSearchApp';
import { useApp } from '../../context/AppContext';

const WordSearchScreen: React.FC = () => {
  const { user } = useApp();

  return <WordSearchApp userPhotoURL={user?.photoURL} />;
};

export default WordSearchScreen;
