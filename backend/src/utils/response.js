export const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};

export const sendPaginatedResponse = (res, data, page, limit, total) => {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
