package com.storyapp.story.exception;

public class ErrorResponse {
    private String message;
    private String error;

    public ErrorResponse(String message, String error) {
        this.message = message;
        this.error = error;
    }

    public String getMessage() { return message; }
    public String getError() { return error; }
}
