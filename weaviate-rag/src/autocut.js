/**
 * Automatic Result Filtering Based on Similarity Score Gaps
 *
 * This module implements intelligent result filtering by detecting natural
 * "gaps" in similarity scores, cutting off results below significant drops.
 */

/**
 * Automatically cut search results based on similarity score gaps.
 *
 * Algorithm:
 * 1. Calculate deltas between consecutive scores
 * 2. Find the largest delta exceeding the threshold
 * 3. Cut results at that point
 * 4. If no significant gap, return top N results
 *
 * @param {Array<Object>} results - Array of result objects with 'score' property (0-1 range)
 * @param {Object} options - Configuration options
 * @param {number} options.minGap - Minimum gap threshold to trigger a cut (default: 0.15)
 * @param {number} options.maxResults - Maximum results to return if no gap found (default: 10)
 * @param {number} options.minResults - Minimum results to always return (default: 3)
 * @returns {Object} Object containing filtered results and metadata
 */
function autoCut(results, options = {}) {
  const {
    minGap = 0.15,
    maxResults = 10,
    minResults = 3
  } = options;

  // Handle edge cases
  if (!results || !Array.isArray(results) || results.length === 0) {
    return {
      results: [],
      cutIndex: 0,
      totalResults: 0,
      gapFound: false,
      largestGap: null,
      largestGapIndex: null
    };
  }

  // Ensure results are sorted by score descending
  const sortedResults = [...results].sort((a, b) => {
    const scoreA = typeof a.score === 'number' ? a.score : 0;
    const scoreB = typeof b.score === 'number' ? b.score : 0;
    return scoreB - scoreA;
  });

  const totalResults = sortedResults.length;

  // If we have fewer results than minResults, return all
  if (totalResults <= minResults) {
    return {
      results: sortedResults,
      cutIndex: totalResults,
      totalResults,
      gapFound: false,
      largestGap: null,
      largestGapIndex: null
    };
  }

  // Calculate deltas between consecutive scores
  const deltas = [];
  for (let i = 0; i < sortedResults.length - 1; i++) {
    const currentScore = sortedResults[i].score ?? 0;
    const nextScore = sortedResults[i + 1].score ?? 0;
    const delta = currentScore - nextScore;
    deltas.push({
      index: i + 1, // Index where the gap occurs (cut point)
      delta,
      scoreBefore: currentScore,
      scoreAfter: nextScore
    });
  }

  // Find the largest delta that exceeds the threshold
  // Only consider gaps after minResults position
  let largestGap = null;
  let largestGapIndex = null;
  let cutIndex = Math.min(maxResults, totalResults);

  for (const d of deltas) {
    // Only consider gaps after we've included minResults
    if (d.index >= minResults) {
      if (d.delta >= minGap) {
        if (largestGap === null || d.delta > largestGap) {
          largestGap = d.delta;
          largestGapIndex = d.index;
        }
      }
    }
  }

  // If we found a significant gap, cut at that point
  const gapFound = largestGapIndex !== null;
  if (gapFound) {
    cutIndex = largestGapIndex;
  } else {
    // No significant gap found, apply maxResults limit
    cutIndex = Math.min(maxResults, totalResults);
  }

  // Ensure we respect minResults
  cutIndex = Math.max(cutIndex, Math.min(minResults, totalResults));

  return {
    results: sortedResults.slice(0, cutIndex),
    cutIndex,
    totalResults,
    gapFound,
    largestGap,
    largestGapIndex,
    deltas // Include deltas for debugging/analysis
  };
}

/**
 * Analyze score distribution without cutting.
 * Useful for understanding the score landscape.
 *
 * @param {Array<Object>} results - Array of result objects with 'score' property
 * @returns {Object} Analysis of the score distribution
 */
function analyzeScores(results) {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      gaps: []
    };
  }

  const scores = results
    .map(r => r.score ?? 0)
    .filter(s => typeof s === 'number')
    .sort((a, b) => b - a);

  if (scores.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      gaps: []
    };
  }

  const sum = scores.reduce((acc, s) => acc + s, 0);
  const mean = sum / scores.length;
  const midIndex = Math.floor(scores.length / 2);
  const median = scores.length % 2 === 0
    ? (scores[midIndex - 1] + scores[midIndex]) / 2
    : scores[midIndex];

  // Find all significant gaps
  const gaps = [];
  for (let i = 0; i < scores.length - 1; i++) {
    const delta = scores[i] - scores[i + 1];
    if (delta >= 0.1) { // Report gaps >= 0.1
      gaps.push({
        index: i + 1,
        delta: Math.round(delta * 1000) / 1000,
        scoreBefore: Math.round(scores[i] * 1000) / 1000,
        scoreAfter: Math.round(scores[i + 1] * 1000) / 1000
      });
    }
  }

  return {
    count: scores.length,
    min: Math.round(Math.min(...scores) * 1000) / 1000,
    max: Math.round(Math.max(...scores) * 1000) / 1000,
    mean: Math.round(mean * 1000) / 1000,
    median: Math.round(median * 1000) / 1000,
    gaps
  };
}

/**
 * Smart auto-cut with adaptive threshold.
 * Adjusts the gap threshold based on the overall score distribution.
 *
 * @param {Array<Object>} results - Array of result objects with 'score' property
 * @param {Object} options - Configuration options
 * @returns {Object} Filtered results with metadata
 */
function adaptiveAutoCut(results, options = {}) {
  const {
    maxResults = 10,
    minResults = 3,
    baseGap = 0.15,
    adaptiveFactor = 0.5
  } = options;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return autoCut(results, { minGap: baseGap, maxResults, minResults });
  }

  const analysis = analyzeScores(results);

  // Adapt threshold based on score spread
  // If scores are tightly clustered, use a smaller gap threshold
  // If scores are spread out, use a larger gap threshold
  const spread = (analysis.max ?? 0) - (analysis.min ?? 0);
  const adaptedGap = baseGap * (1 + (spread * adaptiveFactor));

  // Clamp the adapted gap to reasonable bounds
  const finalGap = Math.max(0.05, Math.min(0.3, adaptedGap));

  return autoCut(results, {
    minGap: finalGap,
    maxResults,
    minResults
  });
}

export {
  autoCut,
  analyzeScores,
  adaptiveAutoCut
};

export default {
  autoCut,
  analyzeScores,
  adaptiveAutoCut
};
