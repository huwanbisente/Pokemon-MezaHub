import pandas as pd
import sys

try:
    file = r'f:\for PORTFOLIO\Project_PokemonV3\Updated_PokeTables.xlsx'
    xl = pd.ExcelFile(file)
    print("Consolidated Cols:")
    print(list(xl.parse('Consolidated (V1 & V2)').columns))
    print("\nMove_List Cols:")
    print(list(xl.parse('Move_List').columns))
    
    print("\nConsolidated Top 3:")
    print(xl.parse('Consolidated (V1 & V2)').head(3).to_string())
    
    print("\nMove_List Top 3:")
    print(xl.parse('Move_List').head(3).to_string())
except Exception as e:
    print(f"Error: {e}")
