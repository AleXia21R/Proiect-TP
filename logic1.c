#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>

#define MAX_WORDS 30
#define MAX_PLAYERS 8

char words[MAX_WORDS][30] = {
    "pisica", "caine", "dragon", "robot", "pizza",
    "masina", "castel", "fantoma", "telefon", "astronaut",
    "broasca", "avion", "copac", "soare", "luna",
    "munte", "peste", "coroana", "sarpe", "calculator",
    "floare", "minge", "tren", "carte", "vulcan",
    "urs", "iepure", "ochelari", "microfon", "racheta"
};

void normalize_text(char text[]) {
    int i, j = 0;
    char temp[100];

    for (i = 0; text[i] != '\0'; i++) {
        if (text[i] != ' ') {
            temp[j] = tolower(text[i]);
            j++;
        }
    }

    temp[j] = '\0';
    strcpy(text, temp);
}

int check_guess(char guess[], char answer[]) {
    normalize_text(guess);
    normalize_text(answer);

    return strcmp(guess, answer) == 0;
}

int calculate_points(int position, int timeLeft) {
    int points = 100 - (position - 1) * 20;

    if (points < 20) {
        points = 20;
    }

    if (timeLeft > 30) {
        points += 20;
    } else if (timeLeft > 15) {
        points += 10;
    }

    return points;
}

int drawer_bonus() {
    return 30;
}

int next_drawer(int currentDrawer, int playersCount) {
    currentDrawer++;

    if (currentDrawer >= playersCount) {
        currentDrawer = 0;
    }

    return currentDrawer;
}

int should_end_round(int guessedCount, int playersCount) {
    int totalGuessers = playersCount - 1;

    if (guessedCount >= totalGuessers) {
        return 1;
    }

    return 0;
}

void generate_three_words(int seed) {
    srand(seed);

    int a = rand() % MAX_WORDS;
    int b = rand() % MAX_WORDS;
    int c = rand() % MAX_WORDS;

    while (b == a) {
        b = rand() % MAX_WORDS;
    }

    while (c == a || c == b) {
        c = rand() % MAX_WORDS;
    }

    printf("%s,%s,%s", words[a], words[b], words[c]);
}

void sort_scores(char input[]) {
    char names[MAX_PLAYERS][50];
    int scores[MAX_PLAYERS];
    int count = 0;

    char *token = strtok(input, ",");

    while (token != NULL && count < MAX_PLAYERS) {
        sscanf(token, "%49[^:]:%d", names[count], &scores[count]);
        count++;
        token = strtok(NULL, ",");
    }

    for (int i = 0; i < count - 1; i++) {
        for (int j = i + 1; j < count; j++) {
            if (scores[j] > scores[i]) {
                int tempScore = scores[i];
                scores[i] = scores[j];
                scores[j] = tempScore;

                char tempName[50];
                strcpy(tempName, names[i]);
                strcpy(names[i], names[j]);
                strcpy(names[j], tempName);
            }
        }
    }

    for (int i = 0; i < count; i++) {
        printf("%s:%d", names[i], scores[i]);

        if (i < count - 1) {
            printf(",");
        }
    }
}

void save_scores(char input[]) {
    FILE *file = fopen("scores.txt", "w");

    if (file == NULL) {
        printf("0");
        return;
    }

    char copy[500];
    strcpy(copy, input);

    char *token = strtok(copy, ",");

    while (token != NULL) {
        fprintf(file, "%s\n", token);
        token = strtok(NULL, ",");
    }

    fclose(file);
    printf("1");
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        return 1;
    }

    if (strcmp(argv[1], "words") == 0) {
        if (argc < 3) return 1;

        int seed = atoi(argv[2]);
        generate_three_words(seed);
        return 0;
    }

    if (strcmp(argv[1], "check") == 0) {
        if (argc < 4) return 1;

        char guess[100];
        char answer[100];

        strcpy(guess, argv[2]);
        strcpy(answer, argv[3]);

        printf("%d", check_guess(guess, answer));
        return 0;
    }

    if (strcmp(argv[1], "points") == 0) {
        if (argc < 4) return 1;

        int position = atoi(argv[2]);
        int timeLeft = atoi(argv[3]);

        printf("%d", calculate_points(position, timeLeft));
        return 0;
    }

    if (strcmp(argv[1], "bonus") == 0) {
        printf("%d", drawer_bonus());
        return 0;
    }

    if (strcmp(argv[1], "nextdrawer") == 0) {
        if (argc < 4) return 1;

        int currentDrawer = atoi(argv[2]);
        int playersCount = atoi(argv[3]);

        printf("%d", next_drawer(currentDrawer, playersCount));
        return 0;
    }

    if (strcmp(argv[1], "endround") == 0) {
        if (argc < 4) return 1;

        int guessedCount = atoi(argv[2]);
        int playersCount = atoi(argv[3]);

        printf("%d", should_end_round(guessedCount, playersCount));
        return 0;
    }

    if (strcmp(argv[1], "sort") == 0) {
        if (argc < 3) return 1;

        char input[500];
        strcpy(input, argv[2]);

        sort_scores(input);
        return 0;
    }

    if (strcmp(argv[1], "save") == 0) {
        if (argc < 3) return 1;

        save_scores(argv[2]);
        return 0;
    }

    return 0;
}
