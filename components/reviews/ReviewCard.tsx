import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { formatDate } from '../../utils/formatters';


interface ReviewCardProps {
  review: {
    rating: number;
    comment: string;
    reviewerName: string;
    createdAt: string;
  };
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const renderStars = () => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={16}
        color={colors.warning}
        fill={index < review.rating ? colors.warning : 'transparent'}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.ratingContainer}>
          {renderStars()}
        </View>
        <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
      </View>
      <Text style={styles.comment}>{review.comment}</Text>
      <Text style={styles.reviewer}>- {review.reviewerName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: colors.gray500,
  },
  comment: {
    fontSize: 14,
    color: colors.gray800,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewer: {
    fontSize: 14,
    color: colors.gray600,
    fontStyle: 'italic',
  },
});