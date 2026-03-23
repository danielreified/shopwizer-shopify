import numpy as np
import pandas as pd


def generate_fake_product_features(n=10000, seed=42):
    np.random.seed(seed)

    # ----------------------------
    # Synthetic feature generation
    # ----------------------------
    data = {
        "views24h": np.random.randint(10, 1000, n),   # Avoid zeroes
        "views7d": np.random.randint(50, 5000, n),
        "clicks24h": np.random.randint(0, 200, n),
        "clicks7d": np.random.randint(0, 1000, n),
        "orders7d": np.random.randint(0, 40, n),
        "orders30d": np.random.randint(1, 150, n),    # Avoid division by 0
        "revenue7d": np.random.uniform(100, 5000, n),
        "revenue30d": np.random.uniform(500, 15000, n),
        "bestSellerScore": np.random.uniform(0, 1, n),
        "trendingScore": np.random.uniform(0, 1, n),
        "fbtScore": np.random.uniform(0, 1, n),
        "similarScore": np.random.uniform(0, 1, n),
    }

    df = pd.DataFrame(data)

    # ----------------------------------------------------------
    # Deterministic label (purchase likelihood / recommendation score)
    # ----------------------------------------------------------
    label = (
        0.25 * (df["clicks24h"] / df["views24h"]) +
        0.20 * (df["clicks7d"] / df["views7d"]) +
        0.20 * (np.log1p(df["orders7d"]) / np.log1p(df["orders30d"])) +
        0.20 * (df["revenue7d"] / df["revenue30d"]) +
        0.10 * df["fbtScore"] +
        0.03 * df["trendingScore"] +
        0.02 * df["bestSellerScore"]
    )

    # Rescale + normalize for spread across 0–1
    label = label / label.max()
    label = np.sqrt(label)  # nonlinear stretch for better variance
    label = np.clip(label, 0, 1)

    df["label"] = label

    return df


if __name__ == "__main__":
    df = generate_fake_product_features()
    df.to_csv("train/fake_features.csv", index=False)
    print(f"✅ Generated fake dataset: {len(df)} rows → train/fake_features.csv")

    # ----------------------------------------------------------
    # Optional: visualize label distribution
    # ----------------------------------------------------------
    try:
        import matplotlib.pyplot as plt

        df["label"].hist(bins=50, color="steelblue", alpha=0.7)
        plt.title("Label Distribution")
        plt.xlabel("Label value (purchase likelihood)")
        plt.ylabel("Frequency")
        plt.show()

    except ImportError:
        print("ℹ️ matplotlib not installed — skipping plot visualization.")
