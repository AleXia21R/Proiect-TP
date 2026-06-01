#include <stdio.h>
#include <string.h>
#include <ctype.h>

#define MAX_PLAYERS 6
#define MAX_WORDS 30

int scores[MAX_PLAYERS];

char words[MAX_WORDS][30] = {
    "pisica", "caine", "dragon", "robot", "pizza",
    "masina", "castel", "fantoma", "telefon", "astronaut",
    "broasca", "avion", "copac", "soare", "luna",
    "munte", "peste", "coroana", "sarpe", "calculator",
    "floare", "minge", "tren", "carte", "vulcan",
    "urs", "iepure", "ochelari", "microfon", "racheta"
};

void reset_scores() {
    for (int i = 0; i < MAX_PLAYERS; i++) {
        scores[i] = 0;
    }
}

void add_score(int player, int points) {
    if (player >= 0 && player < MAX_PLAYERS) {
        scores[player] += points;
    }
}

int get_score(int player) {
    if (player >= 0 && player < MAX_PLAYERS) {
        return scores[player];
    }

    return 0;
}

void normalize_text(char text[]) {
    for (int i = 0; text[i] != '\0'; i++) {
        text[i] = tolower(text[i]);
    }
}

int check_guess(char guess[], char answer[]) {
    normalize_text(guess);
    normalize_text(answer);

    if (strcmp(guess, answer) == 0) {
        return 1;
    }

    return 0;
}

void print_words() {
    printf("Lista cuvinte:\n");

    for (int i = 0; i < MAX_WORDS; i++) {
        printf("%s\n", words[i]);
    }
}
