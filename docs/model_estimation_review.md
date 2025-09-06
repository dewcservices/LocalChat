# Initial Idea for Estimating Model Performance

During the sprint review for sprint 7, our team brought up the idea of estimating how well a model will perform on 
a device. This was for the purpouse of recommending models to users, and would allow users to not even need a single
model ran on their device for them to know what models would provide the highest quality output in the shortest amount
of time.

The idea for this feature was to determine roughly how long a model would take to run on a single device, and then
create a process to run calculations for roughly the same amount of time. This was originally done for a single model, 
and appeared to work on two seperate devices, which is why the idea was brought up during the sprint review.

# Further Research

After the sprint review, further testing was attempted across more models and devices, and from this data, the following data tables were made.

### Upload Time difference factor
| Model | Device 1 Attempt 1 | Device 1 Attempt 2 | Device 2 Attempt 1 | Device 2 Attempt 2 | Device 3 | Device 4 |
| - | - | - | - | - | - | - |
| bart-large-cnn | 1.01 | 0.52 | 0.77 | 0.92 | 0.46 | 0.54 |
| distilbart-cnn-6-6 | 0.51 | 0.86 | 0.81 | 0.96 | 0.46 | 0.55 |
| distilbart-cnn-12-6 | 0.64 | 1.23 | 0.79 | 0.93 | 0.44 | 0.53 |
| nllb-200-distilled-600 | 2.19 | 2.05 | 0.89 | 0.97 | 0.47 | 0.64 |

### Generation Time difference factor
| Model | Device 1 Attempt 1 | Device 1 Attempt 2 | Device 2 Attempt 1 | Device 2 Attempt 2 | Device 3 | Device 4 |
| - | - | - | - | - | - | - |
| bart-large-cnn | 0.3 | 0.67 | 0.56 | 0.99 | 0.79 | 0.45 |
| distilbart-cnn-6-6 | 0.41 | 1.08 | 0.58 | 0.96 | 0.76 | 0.46 |
| distilbart-cnn-12-6 | 0.45 | 1.32 | 0.55 | 0.98 | 0.79 | 0.45 |
| nllb-200-distilled-600 | 0.68 | 2.1 | 0.68 | 1.08 | 0.75 | 0.5 |

From the above tables, all data was collected by running the 4 models 4-5 times using the model benchmarking page in the app, all with the same
estimation algorithms, and then dividing the actual run times for the models by their predicted times to get the factors.

It can almost immediately be seen that there is far to much inconsistency between the factors for different devices for this method to provide even a semi-accurate way of predicting models performances. This data also shows that there is still an issue in the system, where the second attempt at running the models would consistently have a slower generation time when compared to the first, implying that there is a problem either with the system not fully clearing previous model files and variables.